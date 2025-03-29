import * as React from "react";
import { z } from "zod";
import { loginPropsSchema } from "@/schemas/auth.ts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/ui/form.tsx";
import { Input } from "@/features/ui/input.tsx";
import { Button } from "@/features/ui/button.tsx";
import { useMutation } from "@tanstack/react-query";
import { authAPI } from "@/services/api/auth.ts";
import { useNavigate, useRouter } from "@tanstack/react-router";
import ErrorMessage from "@/features/ui/error-message.tsx";
import { setTokens } from "@/lib/token.ts";

const LoginForm: React.FC = () => {
  type LoginForm = z.infer<typeof loginPropsSchema>;

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginPropsSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "all",
  });

  const router = useRouter();
  const navigate = useNavigate();

  const { mutate, status, error } = useMutation({
    mutationFn: authAPI.login,
    mutationKey: ["login"],
    onSuccess: async (data) => {
      setTokens({
        accessToken: data.access,
        refreshToken: data.refresh,
      });

      await router.invalidate();

      await navigate({ to: "/" });
    },
  });

  const onSubmit = (data: LoginForm) => mutate(data);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 w-full max-w-md"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <ErrorMessage error={error?.message} />
          <Button
            disabled={!form.formState.isValid}
            status={status}
            type="submit"
          >
            Log in
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;
