import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";

/**
 * A hook to get a call by ID using Stream Video SDK
 * @param id The ID of the call to retrieve
 * @returns The call object and loading state
 */
export const useGetCallById = (id: string) => {
    const [call, setCall] = useState<Call | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const client = useStreamVideoClient();

    useEffect(() => {
        if (!client || !id) {
            return;
        }
        
        const loadCall = async () => {
            try {
                console.log('Querying call with ID:', id);
                
                // First try getting the call directly
                try {
                    const callInstance = client.call('livestream', id);
                    setCall(callInstance);
                    setIsLoading(false);
                    return;
                } catch (directError) {
                    console.log('Direct call access failed, trying query:', directError);
                }
                
                // If direct access fails, query for calls
                const { calls } = await client.queryCalls({
                    filter_conditions: {
                        id,
                    }
                });
                
                console.log('Query returned calls:', calls);
                
                if (calls.length > 0) {
                    setCall(calls[0]);
                } else {
                    // Create the call if it doesn't exist
                    console.log('Call not found, creating a new one');
                    const newCall = client.call('livestream', id);
                    await newCall.getOrCreate();
                    setCall(newCall);
                }
            } catch (error) {
                console.error('Error loading call:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadCall();
    }, [client, id]);

    return { call, isLoading };
};