import { z } from "zod";

import { db } from "~/server/db";

import { ConflictError, toToolFailure } from "./errors";
import { defineTool, formatBirthday, parseBirthday } from "./helpers";

const genderEnum = z.enum([
  "MALE",
  "FEMALE",
  "OTHER",
  "PREFER_NOT_TO_SAY",
]);

export const createUserProfileParameters = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe("User's display name, e.g. 张三"),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD")
    .optional()
    .describe("Birthday in YYYY-MM-DD format, e.g. 1998-05-01"),
  gender: genderEnum
    .optional()
    .describe("Gender: MALE, FEMALE, OTHER, or PREFER_NOT_TO_SAY"),
  phone: z.string().max(20).optional().describe("Phone number"),
  address: z.string().max(500).optional().describe("Home address"),
  notes: z.string().max(2000).optional().describe("Additional notes"),
});

export const createUserProfileTool = defineTool({
  name: "createUserProfile",
  description:
    "Create a user profile with personal information such as birthday, gender, phone, address, and notes. Use when the user shares personal details for the first time.",
  parameters: createUserProfileParameters,
  execute: async (ctx, args) => {
    try {
      const existing = await db.userProfile.findUnique({
        where: { userId: ctx.userId },
      });

      if (existing) {
        throw new ConflictError(
          "User profile already exists. Use updateUserProfile instead.",
        );
      }

      const [profile, user] = await db.$transaction(async (tx) => {
        if (args.name) {
          await tx.user.update({
            where: { id: ctx.userId },
            data: { name: args.name },
          });
        }

        const createdProfile = await tx.userProfile.create({
          data: {
            userId: ctx.userId,
            birthday: args.birthday ? parseBirthday(args.birthday) : undefined,
            gender: args.gender,
            phone: args.phone,
            address: args.address,
            notes: args.notes,
          },
        });

        const updatedUser = await tx.user.findUniqueOrThrow({
          where: { id: ctx.userId },
          select: { id: true, name: true, email: true },
        });

        return [createdProfile, updatedUser] as const;
      });

      return {
        success: true,
        data: {
          id: profile.id,
          userId: profile.userId,
          name: user.name,
          birthday: formatBirthday(profile.birthday),
          gender: profile.gender,
          phone: profile.phone,
          address: profile.address,
          notes: profile.notes,
        },
      };
    } catch (error) {
      return toToolFailure(error);
    }
  },
});
