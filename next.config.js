/**
 * @type {import('next').NextConfig}
 */
const config = {
  trailingSlash: true,
  redirects: async () => {
    return [
      {
        source: "/:path*",
        destination: "/docs/:path*",
        permanent: true,
      },
    ];
  }
};

export default config;