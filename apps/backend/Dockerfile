FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /backend

RUN set -eux; \
    # Add multiple Debian mirrors
    echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/10no-check-valid-until; \
    # Use retry mechanism for better reliability
    for i in $(seq 1 3); do \
        apt-get update -y && \
        apt-get install -y --no-install-recommends \
            build-essential \
            libpq-dev \
            gettext \
            git \
            nano \
            && break || sleep 15; \
    done; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt /backend/
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

COPY . /backend/

RUN mkdir -p /backend/media /backend/staticfiles

RUN adduser --disabled-password --gecos '' django
RUN chown -R django:django /backend
USER django

EXPOSE 8000

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend.asgi:application"]