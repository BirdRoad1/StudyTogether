import z from "zod";

export const envSchema = z.object({
  PORT: z
    .string()
    .transform((z) => Number(z))
    .refine((n) => n >= 0 && n <= 65535, { error: "Invalid port number" }),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
});
