import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Athlete AI Dashboard"
        description="This is Athlete AI Dashboard page for substats"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
