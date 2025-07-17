import z from "zod";

export const envSchema = z.object({
  PORT: z
    .string()
    .default("8000")
    .transform((z) => Number(z))
    .refine((n) => n >= 0 && n <= 65535, { error: "Invalid port number" }),
});
