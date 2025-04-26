import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";

// interface GetCallByIdProps {
//     id: string;
//     arrStrings?: string[];
// }
export const useGetCallById = (id: string | string[]) => {
    console.log(id)
    const [call, setCall] = useState<Call>();
    const [isLoading, setIsLoading] = useState(true);
    const client = useStreamVideoClient();

    useEffect(() => {
        if (!client) {
            console.log('no client');
            return;
        };
        const loadCall = async () => {
            console.log('querying')
            const { calls } = await client.queryCalls({
                // filter_conditions: {
                //     id
                // }
            })
            console.log(calls)

            if (calls.length > 0)
                setCall(calls[0])

            // console.log(calls)
            setIsLoading(false)
        }
        loadCall()
    }, [client, id])

    return { call, isLoading }
}