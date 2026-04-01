import { Webhook } from "svix";
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req:NextRequest) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error(
          "Please add webhook secret in env CLERK_WEBHOOK_SECRET",
        );
    }

    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Error occurred - No svix headers")
    }

    const payload = await req.json()

    const body = JSON.stringify(payload)

    const wh = new Webhook(WEBHOOK_SECRET)

    let event: WebhookEvent;

    try {
        event = wh.verify(body, {
            "svix-id":svix_id,"svix-timestamp":svix_timestamp,"svix-signature":svix_signature
        }) as WebhookEvent

    } catch (error) {
        console.log("Error verifying webhook")
        return new Response("Error occurred while verifying webhook",{status:400})
    }

    const { id } = event.data
    const eventType = event.type

    if (eventType === "user.created") {
        try {
            const { email_addresses, primary_email_address_id } = event.data
            
            const primaryEmail = email_addresses.find((email) => email.id === primary_email_address_id)
            
            if (!primaryEmail) {
                return new Response("No Primary Email found",{status:400})
            }

            await prisma.user.create({
                data: {
                    id: event.data.id,
                    email: primaryEmail.email_address,
                    isSubscribed:false
                }
            })
            
            console.log("New User Created")
        } catch (error) {
            console.log("Error while creating user in database");
            return new Response("Error while creating user in database", {
              status: 400,
            });
        }
    }
    return new Response("Webhook received successfully",{status:200})
}