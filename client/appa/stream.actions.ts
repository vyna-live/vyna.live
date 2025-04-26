"use server";
import { StreamClient, UserRequest } from "@stream-io/node-sdk";

import { getSelf } from "@/lib/auth-service";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET
export const tokenProvider = async () => {

    const self = await getSelf()
    if (!apiKey) throw new Error("Missing API key")
    if (!apiSecret) throw new Error("Missing API secret")

    const client = new StreamClient(apiKey, apiSecret);
    // const newUser: UserRequest = {
    //     id: self.externalUserID,
    //     name: self.username || self.externalUserID,
    //     image: self.imageUrl || "",
    //     // external_id: self.externalUserID,
    //     role: "user",
    // }
    // await client.upsertUsers([newUser])


    const validity = 60 * 60;
    const exp = 60 * 60;

    // const validity = Math.floor(new Date().getTime() / 1000) + 60 * 60; // 1 hour

    // const issued = Math.floor(new Date().getTime() / 1000) - 60; // now

    // create token 
    const token = client.generateUserToken({
        user_id: self.externalUserID,
        // validity_in_seconds: validity,
        // exp: exp

    })
    return token;
} 