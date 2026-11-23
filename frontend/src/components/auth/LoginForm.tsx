import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import PasswordInput from "../../components/ui/PasswordInput";
import Button from "../../components/ui/Button";
import Divider from "../../components/ui/Divider";

import { useLoginMutation } from "../../services/authApi";
import type { LoginFormData } from "../../Types/formdata";
import { useAuth } from "../../context/AuthContext";



const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();
  const { setIsAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [login, { isLoading }] = useLoginMutation();

  const onSubmit = async (data: LoginFormData) => {
    try {

      const res = await login(data).unwrap();


      document.cookie = `accessToken=${encodeURIComponent(res.accessToken)}; path=/; SameSite=Lax`;
      setIsAuthenticated(true);
      navigate("/");
    } catch (error) {
      console.error("Login Failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card>
        <h1 className="text-3xl font-bold text-center mb-6">
          Login
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <Input
            label="email"
            type="email"
            placeholder="Email"
            {...register("email", {
              required: "Email is required",
            })}
            error={errors.email?.message}
          />

          <PasswordInput
            label="password"
            placeholder="Password"
            {...register("password", {
              required: "Password is required",
            })}
            error={errors.password?.message}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <Divider />

        <p className="text-center text-sm">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 hover:underline"
          >
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default LoginForm;
