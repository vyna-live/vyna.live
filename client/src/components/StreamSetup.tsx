import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Trash2 } from 'lucide-react';
import AgoraVideo from './AgoraVideo';
import { useToast } from '@/hooks/use-toast';

// Define form schema
const streamSetupSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  privacy: z.enum(['public', 'unlisted', 'private']),
  multiplatform: z.boolean().default(false),
  platforms: z.array(
    z.object({
      name: z.enum(['youtube', 'twitch', 'facebook', 'custom']),
      enabled: z.boolean().default(true),
      rtmpUrl: z.string().min(1, 'RTMP URL is required'),
      streamKey: z.string().min(1, 'Stream key is required')
    })
  ).optional()
});

type StreamSetupFormValues = z.infer<typeof streamSetupSchema>;

interface StreamSetupProps {
  onComplete: (data: StreamSetupFormValues) => void;
  onCancel?: () => void;
}

export default function StreamSetup({ onComplete, onCancel }: StreamSetupProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Set up form
  const form = useForm<StreamSetupFormValues>({
    resolver: zodResolver(streamSetupSchema),
    defaultValues: {
      title: '',
      description: '',
      privacy: 'public',
      multiplatform: false,
      platforms: []
    }
  });

  // Handle form submission
  const onSubmit = (data: StreamSetupFormValues) => {
    try {
      // Only include enabled platforms when multiplatform is enabled
      let processedData = { ...data };
      if (!data.multiplatform) {
        processedData.platforms = [];
      } else {
        processedData.platforms = data.platforms?.filter(p => p.enabled) || [];
      }
      
      onComplete(processedData);
    } catch (error) {
      console.error('Error processing form data:', error);
      toast({
        title: 'Error',
        description: 'Failed to start stream. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Add a new platform for multiplatform streaming
  const addPlatform = () => {
    const currentPlatforms = form.getValues('platforms') || [];
    form.setValue('platforms', [
      ...currentPlatforms,
      {
        name: 'youtube',
        enabled: true,
        rtmpUrl: '',
        streamKey: ''
      }
    ]);
  };

  // Remove a platform
  const removePlatform = (index: number) => {
    const currentPlatforms = form.getValues('platforms') || [];
    const updatedPlatforms = [...currentPlatforms];
    updatedPlatforms.splice(index, 1);
    form.setValue('platforms', updatedPlatforms);
  };

  // Generate RTMP URL for platform based on name and stream key
  const getFullRtmpUrl = (platform: string, rtmpUrl: string, streamKey: string): string => {
    if (platform === 'youtube') {
      // YouTube format
      return rtmpUrl.endsWith('/') ? `${rtmpUrl}${streamKey}` : `${rtmpUrl}/${streamKey}`;
    } else if (platform === 'twitch') {
      // Twitch format
      return rtmpUrl.endsWith('/') ? `${rtmpUrl}${streamKey}` : `${rtmpUrl}/${streamKey}`;
    } else if (platform === 'facebook') {
      // Facebook format
      return rtmpUrl.endsWith('/') ? `${rtmpUrl}${streamKey}` : `${rtmpUrl}/${streamKey}`;
    } else {
      // Custom format - just combine as is
      return rtmpUrl.includes('?') ? `${rtmpUrl}&key=${streamKey}` : `${rtmpUrl}?key=${streamKey}`;
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Stream preview */}
        <div className="w-full md:w-1/2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Stream Preview</CardTitle>
              <CardDescription>
                Preview your camera and microphone before going live
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {previewMode ? (
                <AgoraVideo 
                  mode="livestream"
                  showControls={true}
                  onError={(error) => {
                    toast({
                      title: 'Stream Preview Error',
                      description: error,
                      variant: 'destructive',
                    });
                    setPreviewMode(false);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-64 bg-muted rounded-lg">
                  <Button onClick={() => setPreviewMode(true)}>
                    Enable Preview
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stream setup form */}
        <div className="w-full md:w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>Stream Setup</CardTitle>
              <CardDescription>
                Configure your livestream settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stream Title</FormLabel>
                        <FormControl>
                          <Input placeholder="My Awesome Stream" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share details about your stream..." 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="privacy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Privacy</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select privacy setting" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="unlisted">Unlisted</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="multiplatform"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Multiplatform Streaming
                          </FormLabel>
                          <FormDescription>
                            Stream to multiple platforms simultaneously
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('multiplatform') && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="platforms">
                        <AccordionTrigger>
                          Streaming Platforms
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            {/* Platform list */}
                            {(form.watch('platforms') || []).map((platform, index) => (
                              <div key={index} className="rounded-md border p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                  <FormField
                                    control={form.control}
                                    name={`platforms.${index}.name`}
                                    render={({ field }) => (
                                      <FormItem className="flex-1">
                                        <FormLabel>Platform</FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select platform" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="youtube">YouTube</SelectItem>
                                            <SelectItem value="twitch">Twitch</SelectItem>
                                            <SelectItem value="facebook">Facebook</SelectItem>
                                            <SelectItem value="custom">Custom RTMP</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removePlatform(index)}
                                    className="mt-6"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>

                                <FormField
                                  control={form.control}
                                  name={`platforms.${index}.rtmpUrl`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>RTMP URL</FormLabel>
                                      <FormControl>
                                        <Input placeholder="rtmp://..." {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`platforms.${index}.streamKey`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Stream Key</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="password" 
                                          placeholder="Stream key" 
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        This is kept secure and never stored
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            ))}

                            {/* Add platform button */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={addPlatform}
                            >
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Add Platform
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={onCancel || (() => setLocation('/'))}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Go Live</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}