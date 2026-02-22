import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import Loading from "@/components/comman/Loading";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <div className="text-muted-foreground">
          {isAuthenticated
            ? "Redirecting to dashboard..."
            : "Redirecting to login..."}
        </div>
        <div className="animate-pulse text-sm text-muted-foreground">
          Please wait...
        </div>
      </div>
    </div>
  );
}