from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from experiments.models import Project
from experiments.services.variant_service import get_experiment_by_key


class ExperimentConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for real-time experiment updates.
    """

    async def connect(self):
        """
        Called when the websocket is handshaking.
        Validate API key and set up user/project info.
        """
        # Get the API key from the query string
        query_string = self.scope.get('query_string', b'').decode()
        query_params = dict(param.split('=') for param in query_string.split('&') if '=' in param)

        api_key = query_params.get('api_key')

        if not api_key:
            await self.close(code=4000)
            return

        # Validate the API key and get project
        self.project = await self.get_project(api_key)

        if not self.project:
            await self.close(code=4001)
            return

        # Extract user identifiers
        user_id = query_params.get('user_id')
        device_id = query_params.get('device_id')
        email = query_params.get('email')
        external_id = query_params.get('external_id')

        # Ensure at least one identifier is provided
        if not any([user_id, device_id, email, external_id]):
            await self.close(code=4002)
            return

        # Get or create user
        try:
            self.user = await self.get_user(
                self.project,
                user_id=user_id,
                device_id=device_id,
                email=email,
                external_id=external_id
            )
        except Exception:
            await self.close(code=4003)
            return

        # Get experiment keys from query params or subscribe to all if none provided
        experiment_keys = query_params.get('experiments', '').split(',')
        experiment_keys = [key for key in experiment_keys if key]

        # Set up channels for user-specific updates
        await self.channel_layer.group_add(
            f"user_{str(self.user.id)}",
            self.channel_name
        )

        # Set up channels for experiment-specific updates
        for key in experiment_keys:
            experiment = await self.get_experiment(self.project, key)
            if experiment:
                group_name = f"experiment_{str(experiment.id)}"
                await self.channel_layer.group_add(
                    group_name,
                    self.channel_name
                )

        # Set up channel for project-wide updates
        await self.channel_layer.group_add(
            f"project_{str(self.project.id)}",
            self.channel_name
        )

        # Accept the connection
        await self.accept()

        # Send initial state
        await self.send_initial_state(experiment_keys)

    async def disconnect(self, close_code):
        """
        Called when the WebSocket closes.
        """
        # Clean up channel group membership
        if hasattr(self, 'user'):
            await self.channel_layer.group_discard(
                f"user_{str(self.user.id)}",
                self.channel_name
            )

        if hasattr(self, 'project'):
            await self.channel_layer.group_discard(
                f"project_{str(self.project.id)}",
                self.channel_name
            )

    async def receive_json(self, content):
        """
        Called when we receive a text frame from the client.
        """
        message_type = content.get('type')

        if message_type == 'subscribe_experiment':
            experiment_key = content.get('experiment_key')
            if experiment_key:
                experiment = await self.get_experiment(self.project, experiment_key)
                if experiment:
                    group_name = f"experiment_{str(experiment.id)}"
                    await self.channel_layer.group_add(
                        group_name,
                        self.channel_name
                    )
                    # Send the current state of this experiment
                    await self.send_experiment_state(experiment_key)

        elif message_type == 'unsubscribe_experiment':
            experiment_key = content.get('experiment_key')
            if experiment_key:
                experiment = await self.get_experiment(self.project, experiment_key)
                if experiment:
                    group_name = f"experiment_{str(experiment.id)}"
                    await self.channel_layer.group_discard(
                        group_name,
                        self.channel_name
                    )

    async def experiment_update(self, event):
        """
        Handler for experiment update events.
        """
        # Send the experiment update to the WebSocket
        await self.send_json({
            'type': 'experiment_updated',
            'experiment': event['experiment'],
            'variant': event['variant']
        })

    async def distribution_update(self, event):
        """
        Handler for distribution update events.
        """
        # Send the distribution update to the WebSocket
        await self.send_json({
            'type': 'distribution_updated',
            'experiment': event['experiment'],
            'variant': event['variant']
        })

    @database_sync_to_async
    def get_project(self, api_key):
        """
        Get project by API key.
        """
        try:
            return Project.objects.get(api_key=api_key)
        except Project.DoesNotExist:
            return None

    @database_sync_to_async
    def get_user(self, project, user_id=None, device_id=None, email=None, external_id=None):
        """
        Get or create user based on provided identifiers.
        """
        from experiments.services.variant_service import get_or_create_user

        identifiers = {
            'id': user_id,
            'device_id': device_id,
            'email': email,
            'external_id': external_id
        }

        return get_or_create_user(project, identifiers)

    @database_sync_to_async
    def get_experiment(self, project, experiment_key):
        """
        Get experiment by key.
        """
        return get_experiment_by_key(project, experiment_key)

    @database_sync_to_async
    def get_distribution(self, user, experiment):
        """
        Get distribution for user and experiment.
        """
        from experiments.services.variant_service import get_or_create_distribution
        return get_or_create_distribution(user, experiment)

    async def send_initial_state(self, experiment_keys):
        """
        Send the initial state of subscribed experiments.
        """
        for key in experiment_keys:
            await self.send_experiment_state(key)

    async def send_experiment_state(self, experiment_key):
        """
        Send the current state of a specific experiment.
        """
        experiment = await self.get_experiment(self.project, experiment_key)
        if not experiment:
            return

        distribution = await self.get_distribution(self.user, experiment)

        # Fetch variant data in a sync-to-async wrapper
        variant = await database_sync_to_async(lambda: distribution.variant)()

        # Format the response
        experiment_data = {
            'id': str(experiment.id),
            'key': experiment.key,
            'name': experiment.name,
            'status': experiment.status,
            'type': experiment.type,
        }

        variant_data = {
            'id': str(variant.id),
            'key': variant.key,
            'payload': variant.payload
        }

        await self.send_json({
            'type': 'experiment_state',
            'experiment': experiment_data,
            'variant': variant_data
        })