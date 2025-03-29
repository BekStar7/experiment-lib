import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/features/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { projectQueries } from "@/services/queries/project.ts";
import { ChevronRight, CirclePlus, LogOut, Plus } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/features/ui/collapsible.tsx";
import { Link, useParams } from "@tanstack/react-router";
import AddProjectDialog from "@/features/project/add-project-dialog.tsx";
import CreateExperimentDialog from "@/features/experiment/create-experiment-dialog.tsx";
import { useAuth } from "@/features/layout/auth/auth-context.tsx";

const AppSidebar = () => {
  const { data, status } = useQuery(projectQueries.getProjects());
  const projectId = useParams({ strict: false }).projectId;
  const experimentId = useParams({ strict: false }).experimentId;

  const auth = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="items-center flex-row">
        <SidebarMenu>
          <SidebarMenuButton title="Add Project" asChild>
            <Link to="/">
              <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
              Exparo
            </Link>
          </SidebarMenuButton>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <AddProjectDialog>
            <SidebarGroupAction className="cursor-pointer" title="Add Project">
              <Plus /> <span className="sr-only">Add Project</span>
            </SidebarGroupAction>
          </AddProjectDialog>
          <SidebarGroupContent>
            <SidebarMenu>
              {status === "pending"
                ? Array.from({ length: 5 }).map((_, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuSkeleton />
                    </SidebarMenuItem>
                  ))
                : status === "success" &&
                  data.map((project) => (
                    <Collapsible
                      key={project.id}
                      defaultOpen={project.id === projectId}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={project.id === projectId}
                          tooltip={project.title}
                          asChild
                        >
                          <Link
                            to="/project/$projectId"
                            params={{ projectId: project.id }}
                          >
                            {project.title}
                          </Link>
                        </SidebarMenuButton>
                        {project.experiments?.length > 0 ? (
                          <>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuAction className="data-[state=open]:rotate-90">
                                <ChevronRight />
                                <span className="sr-only">Toggle</span>
                              </SidebarMenuAction>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                <CreateExperimentDialog projectId={project.id}>
                                  <SidebarMenuSubButton className="cursor-pointer">
                                    <CirclePlus className="w-3 h-3" />
                                    <span>Add experiment</span>
                                  </SidebarMenuSubButton>
                                </CreateExperimentDialog>
                                {project.experiments.map((experiment) => (
                                  <SidebarMenuSubItem key={experiment.id}>
                                    <SidebarMenuSubButton
                                      isActive={experiment.id === experimentId}
                                      asChild
                                    >
                                      <Link
                                        to="/project/$projectId/experiment/$experimentId"
                                        params={{
                                          projectId: project.id,
                                          experimentId: experiment.id,
                                        }}
                                      >
                                        {experiment.name}
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </>
                        ) : (
                          <CreateExperimentDialog projectId={project.id}>
                            <SidebarMenuAction>
                              <Plus />
                              <span className="sr-only">Add experiment</span>
                            </SidebarMenuAction>
                          </CreateExperimentDialog>
                        )}
                      </SidebarMenuItem>
                    </Collapsible>
                  ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="cursor-pointer" onClick={auth.logout}>
              <LogOut className="h-4 w-4" />
              Logout
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
