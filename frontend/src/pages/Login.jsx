import LoginHero from "../components/auth/LoginHero";
import LoginForm from "../components/auth/LoginForm";

export default function Login() {

  return (

    <div className="min-h-screen bg-[#050608] overflow-hidden">

      <div className="grid min-h-screen lg:grid-cols-2">

        <div className="hidden lg:block px-20">

          <LoginHero />

        </div>

        <div className="flex items-center justify-center p-8 lg:p-20">

          <LoginForm />

        </div>

      </div>

    </div>

  );

}