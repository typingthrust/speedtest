import { SignIn } from '@clerk/clerk-react';

const SignInPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white">
    <SignIn routing="path" path="/signin" afterSignInUrl="/profile" afterSignUpUrl="/profile" />
  </div>
);

export default SignInPage; 