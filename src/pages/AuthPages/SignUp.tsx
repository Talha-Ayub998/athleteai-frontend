import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="`Athlete AI Dashboard`"
        description="This is Athlete AI Dashboard page for substats"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
