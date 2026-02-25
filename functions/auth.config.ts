const clerkDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

if (!clerkDomain) {
  throw new Error("Missing CLERK_JWT_ISSUER_DOMAIN in Convex environment.");
}

const authConfig = {
  providers: [
    {
      domain: clerkDomain,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
