import { Type } from "@google/genai";
import React, { useRef, useState } from 'react';
import { generateJsonContent, generateTextContent } from '../services/aiService';
import { LearningPlanTask, User } from '../types';
import Button from './Button';
import Card from './Card';
import { BookOpenIcon, DumbbellIcon, FileTextIcon, PlayCircleIcon, RocketIcon, SearchIcon, SparklesIcon, UploadCloudIcon, XIcon } from './icons';

interface PersonalizedLearningPathViewProps {
  user: User;
}

const taskTypeGradients = {
    video: 'bg-gradient-to-br from-secondary to-cyan-400',
    read: 'bg-gradient-to-br from-primary to-indigo-400',
    practice: 'bg-gradient-to-br from-warning to-amber-400',
};

const taskTypeBorders = {
    video: 'border-secondary',
    read: 'border-primary',
    practice: 'border-warning-dark',
};

const taskIcons = {
    video: <PlayCircleIcon className="h-8 w-8 text-white" />,
    read: <BookOpenIcon className="h-8 w-8 text-white" />,
    practice: <DumbbellIcon className="h-8 w-8 text-white" />,
};

// --- Sub-components ---

const FileUploadSection: React.FC<{
    onFileAnalyzed: (analysis: string, fileName: string) => void;
    isAnalyzing: boolean;
    error: string | null;
}> = ({ onFileAnalyzed, isAnalyzing, error }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        setUploadedFile(file);
    };

    const handleAnalyze = async () => {
        if (!uploadedFile) return;

        try {
            const fileContent = await readFileContent(uploadedFile);
            onFileAnalyzed(fileContent, uploadedFile.name);
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Failed to read the file. Please try again.');
        }
    };

    const readFileContent = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const result = e.target?.result as string;
                resolve(result);
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            
            // For text files, read as text
            if (file.type.startsWith('text/') || 
                file.name.endsWith('.txt') || 
                file.name.endsWith('.md') ||
                file.name.endsWith('.json') ||
                file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else if (file.type === 'application/pdf' || 
                       file.type === 'application/msword' ||
                       file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                // For binary files, we'll send a message about the file
                resolve(`[File: ${file.name}, Type: ${file.type}, Size: ${(file.size / 1024).toFixed(2)}KB]`);
            } else {
                reject(new Error('Unsupported file type'));
            }
        });
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Card className="p-6 mb-6">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <UploadCloudIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-grow">
                    <h3 className="text-lg font-bold text-neutral-extradark mb-2">Upload Your Study Material</h3>
                    <p className="text-sm text-neutral-medium mb-4">
                        Upload notes, assignments, or study materials. Our AI will analyze them and create a personalized learning plan.
                    </p>
                    
                    {!uploadedFile ? (
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileSelect}
                                accept=".txt,.md,.pdf,.doc,.docx,.json,.csv,text/*"
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload">
                                <div className="border-2 border-dashed border-neutral-light rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                                    <UploadCloudIcon className="w-10 h-10 text-neutral-medium mx-auto mb-2" />
                                    <p className="text-sm font-semibold text-neutral-dark">
                                        Click to upload or drag and drop
                                    </p>
                                    <p className="text-xs text-neutral-medium mt-1">
                                        TXT, MD, PDF, DOC, DOCX, JSON, CSV (max 10MB)
                                    </p>
                                </div>
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-neutral-ultralight rounded-lg">
                                <FileTextIcon className="w-6 h-6 text-primary flex-shrink-0" />
                                <div className="flex-grow min-w-0">
                                    <p className="text-sm font-semibold text-neutral-dark truncate">
                                        {uploadedFile.name}
                                    </p>
                                    <p className="text-xs text-neutral-medium">
                                        {(uploadedFile.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                                <button
                                    onClick={handleRemoveFile}
                                    className="flex-shrink-0 p-1 hover:bg-neutral-light rounded-full transition-colors"
                                >
                                    <XIcon className="w-5 h-5 text-neutral-medium" />
                                </button>
                            </div>
                            <Button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="w-full"
                            >
                                <SparklesIcon className="w-5 h-5 mr-2" />
                                {isAnalyzing ? 'Analyzing...' : 'Analyze & Generate Plan'}
                            </Button>
                        </div>
                    )}
                    
                    {error && (
                        <p className="text-danger text-sm mt-3 flex items-center gap-2">
                            <span className="inline-block w-1 h-1 bg-danger rounded-full"></span>
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
};

const PlanGenerator: React.FC<{
    onGenerate: (topic: string) => void;
    error: string | null;
}> = ({ onGenerate, error }) => {
    const [topic, setTopic] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(topic);
    };

    return (
        <Card className="text-center p-8">
            <h2 className="text-2xl font-bold font-display text-neutral-extradark">What do you want to learn?</h2>
            <p className="text-neutral-medium mt-2 mb-6">Enter any topic, and our AI will craft a personalized 7-day learning plan for you.</p>
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
                <div className="relative">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., 'Data Structures' or 'Quantum Computing'"
                        className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-xl border-2 border-white/20 rounded-2xl shadow-xl shadow-black/5 text-neutral-dark focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-medium">
                        <SearchIcon className="w-6 h-6" />
                    </div>
                </div>
                {error && <p className="text-danger text-sm mt-2">{error}</p>}
                <Button type="submit" className="mt-4 !px-8 !py-3">
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Generate Plan
                </Button>
            </form>
        </Card>
    );
};

const LearningPlan: React.FC<{
    topic: string;
    plan: LearningPlanTask[];
    onReset: () => void;
}> = ({ topic, plan, onReset }) => (
    <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-center">Your 7-Day Plan for <span className="text-primary">{topic}</span></h2>
        {plan.map(task => (
            <Card key={task.day} className={`!p-0 border-l-8 ${taskTypeBorders[task.type as keyof typeof taskTypeBorders]}`}>
                <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-32 flex flex-col items-center justify-center text-center p-4 md:border-r border-b md:border-b-0 border-black/10">
                        <p className="text-sm font-semibold text-neutral-medium">DAY</p>
                        <p className="text-5xl font-display font-bold text-neutral-extradark">{task.day}</p>
                    </div>
                    <div className="flex-grow p-4 flex items-center">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 mr-4 text-white ${taskTypeGradients[task.type as keyof typeof taskTypeGradients]}`}>
                            {taskIcons[task.type as keyof typeof taskIcons]}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-primary">{task.topic}</p>
                            <h3 className="font-bold text-lg text-neutral-dark">{task.title}</h3>
                            <p className="text-sm text-neutral-medium mt-1">{task.description}</p>
                        </div>
                    </div>
                </div>
            </Card>
        ))}
        <div className="text-center mt-8">
            <Button variant="outline" onClick={onReset}>Create a New Plan</Button>
        </div>
    </div>
);


const PersonalizedLearningPathView: React.FC<PersonalizedLearningPathViewProps> = ({ user }) => {
    const [topic, setTopic] = useState('');
    const [learningPlan, setLearningPlan] = useState<LearningPlanTask[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileAnalysisError, setFileAnalysisError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string>('');

    const handleFileAnalyzed = async (fileContent: string, fileName: string) => {
        setIsAnalyzing(true);
        setFileAnalysisError(null);
        setError(null);
        setAnalysisResult('');
        
        try {
            // First, analyze the file content to extract key topics and learning areas
            const analysisPrompt = `Analyze the following document content and provide:
1. Main topics and concepts covered
2. Student's current knowledge level based on the content
3. Areas that need improvement or further study
4. Recommended learning focus areas

Document: ${fileName}
Content: ${fileContent.substring(0, 5000)}

Provide a clear, structured analysis that will help create a personalized learning plan.`;

            const analysis = await generateTextContent(analysisPrompt);
            setAnalysisResult(analysis);
            
            // Extract a topic for the learning plan
            const topicExtractionPrompt = `Based on this analysis, suggest a single, concise topic (2-4 words) for a personalized learning plan:

${analysis}

Respond with ONLY the topic name, nothing else.`;

            const extractedTopic = await generateTextContent(topicExtractionPrompt);
            const cleanTopic = extractedTopic.trim().replace(/['"]/g, '');
            
            // Generate the learning plan based on the analysis
            await handleGeneratePlan(cleanTopic, analysis);
            
        } catch (e) {
            console.error("Failed to analyze file:", e);
            setFileAnalysisError("Sorry, we couldn't analyze your file. Please try again or enter a topic manually.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGeneratePlan = async (selectedTopic: string, contextAnalysis?: string) => {
        if (!selectedTopic.trim()) {
            setError('Please enter a topic to generate a plan.');
            return;
        }
        
        setTopic(selectedTopic);
        setIsLoading(true);
        setError(null);
        setLearningPlan([]);
        
        try {
            const schema = {
                type: Type.OBJECT,
                properties: {
                    plan: {
                        type: Type.ARRAY,
                        description: "A 7-day learning plan with one task per day.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                day: { type: Type.NUMBER },
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['video', 'read', 'practice'] },
                                topic: { type: Type.STRING }
                            },
                            required: ["day", "title", "description", "type", "topic"]
                        }
                    }
                },
                required: ["plan"]
            };

            let prompt = `Create a personalized 7-day learning plan for a student at the ${user.educationLevel} level, focused on the topic "${selectedTopic}". Generate one task per day, varying the task type (video, read, practice). Each task should have a clear title, a brief description, and a relevant sub-topic related to the main topic "${selectedTopic}".`;
            
            if (contextAnalysis) {
                prompt += `\n\nAdditional context from student's uploaded materials:\n${contextAnalysis}\n\nUse this context to tailor the learning plan to address specific gaps and build upon existing knowledge.`;
            }
            
            const response = await generateJsonContent(prompt, schema);
            
            if (response && Array.isArray(response.plan)) {
                setLearningPlan(response.plan.sort((a: LearningPlanTask, b: LearningPlanTask) => a.day - b.day));
            } else {
                throw new Error("Invalid plan format received from AI.");
            }
        } catch (e) {
            console.error("Failed to generate learning plan:", e);
            setError("Sorry, we couldn't create a plan for that topic. It might be too broad or specific. Please try another topic.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setTopic('');
        setLearningPlan([]);
        setError(null);
        setFileAnalysisError(null);
        setAnalysisResult('');
    };

    return (
        <>
            <header className="mb-8 text-center">
                <div className="inline-block bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-full mb-4">
                    <RocketIcon className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold font-display text-neutral-extradark">Personalized Learning Plan</h1>
                <p className="text-lg text-neutral-medium mt-2 max-w-2xl mx-auto">A custom week-long journey to boost your skills, crafted by AI on demand.</p>
            </header>

            <div className="max-w-4xl mx-auto">
                {/* File Upload Section - Always visible when no plan is generated */}
                {!isLoading && learningPlan.length === 0 && (
                    <FileUploadSection 
                        onFileAnalyzed={handleFileAnalyzed}
                        isAnalyzing={isAnalyzing}
                        error={fileAnalysisError}
                    />
                )}

                {/* Analysis Result Display */}
                {analysisResult && learningPlan.length === 0 && !isLoading && (
                    <Card className="p-6 mb-6 bg-gradient-to-br from-blue-50 to-purple-50">
                        <h3 className="text-lg font-bold text-neutral-extradark mb-3 flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-primary" />
                            AI Analysis Results
                        </h3>
                        <div className="prose prose-sm max-w-none">
                            <p className="text-neutral-dark whitespace-pre-wrap">{analysisResult}</p>
                        </div>
                    </Card>
                )}

                {isLoading || isAnalyzing ? (
                    <Card className="text-center p-12">
                        <SparklesIcon className="h-12 w-12 text-primary mx-auto animate-pulse" />
                        <p className="mt-4 text-lg font-semibold text-neutral-dark">
                            {isAnalyzing ? 'Analyzing your file...' : `Crafting your plan for "${topic}"...`}
                        </p>
                        <p className="text-neutral-medium mt-1">This may take a moment.</p>
                    </Card>
                ) : learningPlan.length > 0 ? (
                    <LearningPlan topic={topic} plan={learningPlan} onReset={handleReset} />
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-2 text-sm text-neutral-medium">
                                <div className="h-px bg-neutral-light flex-grow w-16"></div>
                                <span>OR</span>
                                <div className="h-px bg-neutral-light flex-grow w-16"></div>
                            </div>
                        </div>
                        <PlanGenerator onGenerate={(topic) => handleGeneratePlan(topic)} error={error} />
                    </>
                )}
            </div>
        </>
    );
};

export default PersonalizedLearningPathView;