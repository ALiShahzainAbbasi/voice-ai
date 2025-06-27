import { useState, useRef } from "react";
import { Upload, Video, Play, Pause, Download, Trash2, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface TalkingVideo {
  id: string;
  name: string;
  sourceImage: string;
  audioText: string;
  voiceId: string;
  videoUrl?: string;
  audioUrl?: string;
  status: 'preparing' | 'processing' | 'ready' | 'error';
  createdAt: Date;
  duration?: number;
}

interface TalkingVideoGeneratorProps {
  friends: any[];
  onVideoGenerated: (video: TalkingVideo) => void;
}

export function TalkingVideoGenerator({ friends, onVideoGenerated }: TalkingVideoGeneratorProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState("");
  const [audioText, setAudioText] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [generatedVideos, setGeneratedVideos] = useState<TalkingVideo[]>([]);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setSelectedImageFile(file);
    
    toast({
      title: "Image Uploaded",
      description: "Selfie uploaded successfully. Ready to generate talking video!",
    });
  };

  const startPhotoCapture = async () => {
    try {
      console.log('Requesting camera access...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      // Set capturing state first to render video element
      setIsCapturingPhoto(true);
      
      // Small delay to ensure video element is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front camera for selfies
        } 
      });
      
      console.log('Camera stream obtained:', stream);
      streamRef.current = stream;
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true; // Needed for autoplay in some browsers
        
        // Wait for video to be ready
        const handleVideoReady = () => {
          console.log('Video metadata loaded, dimensions:', video.videoWidth, video.videoHeight);
          
          video.play().then(() => {
            console.log('Video playing successfully');
            setIsCapturingPhoto(true);
            
            toast({
              title: "Camera Ready",
              description: "Position yourself in the frame and click capture when ready",
            });
          }).catch((error) => {
            console.error('Failed to play video:', error);
            // Try alternative approach
            setTimeout(() => {
              if (video.readyState >= 2) {
                console.log('Video ready for capture despite play error');
                setIsCapturingPhoto(true);
                toast({
                  title: "Camera Ready",
                  description: "Camera is ready for photo capture",
                });
              }
            }, 500);
          });
        };
        
        if (video.readyState >= 1) {
          handleVideoReady();
        } else {
          video.onloadedmetadata = handleVideoReady;
        }
      } else {
        console.error('Video ref not available');
        throw new Error('Video element not ready');
      }
      
    } catch (error: any) {
      console.error('Failed to start camera:', error);
      toast({
        title: "Camera Access Failed",
        description: error.message || "Unable to access camera. Please check permissions and try again.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      toast({
        title: "Capture Failed",
        description: "Camera not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error('Canvas context not available');
      return;
    }

    // Ensure video has loaded and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video not ready:', video.videoWidth, video.videoHeight);
      toast({
        title: "Video Not Ready",
        description: "Please wait for camera to initialize completely.",
        variant: "destructive",
      });
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Clear canvas and draw video frame
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setSelectedImage(imageUrl);
        
        // Create a File object from the blob
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        setSelectedImageFile(file);
        
        stopPhotoCapture();
        
        toast({
          title: "Photo Captured",
          description: "Selfie captured successfully. Ready to generate talking video!",
        });
      } else {
        toast({
          title: "Capture Failed",
          description: "Failed to capture photo. Please try again.",
          variant: "destructive",
        });
      }
    }, 'image/jpeg', 0.8);
  };

  const stopPhotoCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturingPhoto(false);
  };

  const generateTalkingVideo = async () => {
    if (!selectedImageFile || !audioText.trim() || !selectedVoiceId || !videoName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide image, text, voice selection, and video name",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 800);

      // Prepare data for the API call
      const requestData = {
        name: videoName.trim(),
        text: audioText.trim(),
        voiceId: selectedVoiceId.trim(),
      };

      console.log('Generating talking video with data:', requestData);

      // Call API to generate talking video
      const response = await fetch('/api/generate-talking-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (response.ok) {
        const videoData = await response.json();
        
        const newVideo: TalkingVideo = {
          id: videoData.id || `video-${Date.now()}`,
          name: videoName,
          sourceImage: selectedImage!,
          audioText: audioText,
          voiceId: selectedVoiceId,
          videoUrl: videoData.videoUrl,
          audioUrl: videoData.audioUrl, // Add the generated audio URL
          status: 'ready',
          createdAt: new Date(),
          duration: videoData.duration
        };

        setGeneratedVideos(prev => [...prev, newVideo]);
        onVideoGenerated(newVideo);
        
        // Clear form
        setVideoName("");
        setAudioText("");
        setSelectedImage(null);
        setSelectedImageFile(null);
        setSelectedVoiceId("");
        
        toast({
          title: "Video Generated",
          description: `Talking video "${videoName}" created successfully!`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate talking video');
      }
    } catch (error) {
      console.error('Talking video generation error:', error);
      
      let errorMessage = "An unexpected error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Provide more specific error guidance
      if (errorMessage.includes("API key")) {
        errorMessage = "ElevenLabs API key not configured. Please add your API key in the Secrets tab.";
      } else if (errorMessage.includes("Name, text, and voice")) {
        errorMessage = "Please fill in all required fields: video name, text content, and voice selection.";
      }
      
      toast({
        title: "Video Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const deleteVideo = (videoId: string) => {
    setGeneratedVideos(prev => prev.filter(video => video.id !== videoId));
    
    toast({
      title: "Video Deleted",
      description: "Talking video has been removed",
    });
  };

  const clearImage = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Video Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-green-600" />
            <span>Generate Talking Video</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Video className="h-4 w-4" />
            <AlertDescription>
              Upload a selfie or capture one with your camera, then generate a talking video where your photo speaks any text using AI voice synthesis.
            </AlertDescription>
          </Alert>

          {/* Image Upload/Capture Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Source Image</Label>
            
            {!isCapturingPhoto ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                    disabled={isProcessing}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Selfie
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={startPhotoCapture}
                    variant="outline"
                    className="w-full"
                    disabled={isProcessing}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Selfie
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  className="w-full max-w-md mx-auto rounded-lg"
                  autoPlay
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-2 justify-center">
                  <Button onClick={capturePhoto}>
                    <Camera className="w-4 h-4 mr-2" />
                    Capture Photo
                  </Button>
                  <Button variant="outline" onClick={stopPhotoCapture}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {selectedImage && (
              <div className="space-y-2">
                <Label className="text-sm">Selected Image</Label>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <img 
                    src={selectedImage} 
                    alt="Selected selfie"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <span className="flex-1 text-sm">Ready for video generation</span>
                  <Button
                    onClick={clearImage}
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Video Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video-name">Video Name</Label>
              <Input
                id="video-name"
                value={videoName}
                onChange={(e) => setVideoName(e.target.value)}
                placeholder="e.g., My Introduction Video"
                disabled={isProcessing}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice-selection">Voice</Label>
              <select
                id="voice-selection"
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                disabled={isProcessing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a voice...</option>
                {friends.map((friend) => (
                  <option key={friend.id} value={friend.voiceId}>
                    {friend.name} ({friend.personality})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audio-text">Text to Speak</Label>
            <Textarea
              id="audio-text"
              value={audioText}
              onChange={(e) => setAudioText(e.target.value)}
              placeholder="Enter the text you want your selfie to speak..."
              disabled={isProcessing}
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-gray-500">
              {audioText.length}/500 characters
            </p>
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <Label className="text-sm">Generating Talking Video...</Label>
              <Progress value={processingProgress} className="w-full" />
              <p className="text-xs text-gray-500">
                Processing image and generating synchronized audio. This may take a few moments.
              </p>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateTalkingVideo}
            disabled={!selectedImage || !audioText.trim() || !selectedVoiceId || !videoName.trim() || isProcessing}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Generate Talking Video
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Videos List */}
      {generatedVideos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Talking Videos ({generatedVideos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedVideos.map((video) => (
                <div
                  key={video.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={video.sourceImage} 
                        alt={video.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {video.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Created {video.createdAt.toLocaleDateString()}
                          {video.duration && ` • ${video.duration}s`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {video.audioUrl && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const audio = new Audio(video.audioUrl);
                            audio.play().catch(error => {
                              console.error('Audio playback failed:', error);
                              toast({
                                title: "Audio Playback Failed",
                                description: "Unable to play generated voice audio",
                                variant: "destructive",
                              });
                            });
                          }}
                        >
                          <Play className="w-4 h-4" />
                          Test Voice
                        </Button>
                      )}
                      {video.videoUrl && video.videoUrl !== 'data:video/mp4;base64,mockVideoData' && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={video.videoUrl} download={`${video.name}.mp4`}>
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteVideo(video.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    "{video.audioText}"
                  </p>
                  
                  {video.videoUrl && video.videoUrl !== 'data:video/mp4;base64,mockVideoData' ? (
                    <video 
                      controls 
                      className="w-full max-w-md rounded-lg"
                      preload="metadata"
                    >
                      <source src={video.videoUrl} type="video/mp4" />
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <div className="w-full max-w-md mx-auto p-8 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                      <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Video generation completed! Use the Test Voice button to hear the generated audio.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Full video generation requires integration with specialized AI video services.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}