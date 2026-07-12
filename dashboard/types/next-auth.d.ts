import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      wazuhGroup: string;
    } & DefaultSession["user"];
  }

  interface User {
    wazuhGroup: string;
  }
}
