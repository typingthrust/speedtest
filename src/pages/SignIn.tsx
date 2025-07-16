import { SignIn } from '@clerk/clerk-react';

const SignInPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white">
    <SignIn routing="path" path="/signin" />
  </div>
);

export default SignInPage; 