import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse, Type } from "@google/genai";

// Initialize the AI client once in the service.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Core function for single-response content generation.
 * @param params - The parameters for the generateContent call.
 * @returns The response from the AI model.
 */
async function generate(params: GenerateContentParameters): Promise<GenerateContentResponse> {
    try {
        const response = await ai.models.generateContent(params);
        return response;
    } catch (error) {
        console.error("AI Service Error:", error);
        // Re-throw a more generic error to be handled by the UI component.
        throw new Error("Failed to generate content from the AI service.");
    }
}

/**
 * Core function for streaming content generation.
 * @param params - The parameters for the generateContentStream call.
 * @returns The streaming response from the AI model.
 */
async function generateStream(params: GenerateContentParameters) {
    try {
        const response = await ai.models.generateContentStream(params);
        return response;
    } catch (error) {
        console.error("AI Service Error (Stream):", error);
        throw new Error("Failed to generate streaming content from the AI service.");
    }
}

/**
 * Generates structured JSON content from a prompt and schema.
 * @param prompt - The text prompt to send to the model.
 * @param schema - The JSON schema for the expected response.
 * @param model - The model to use (defaults to 'gemini-2.5-flash').
 * @returns A promise that resolves to the parsed JSON object.
 */
export async function generateJsonContent(prompt: string, schema: any, model: string = 'gemini-2.5-flash'): Promise<any> {
    const response = await generate({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
        }
    });
    return JSON.parse(response.text);
}

/**
 * Generates plain text content from a prompt.
 * @param prompt - The text prompt to send to the model.
 * @param model - The model to use (defaults to 'gemini-2.5-flash').
 * @returns A promise that resolves to the generated text string.
 */
export async function generateTextContent(prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> {
    const response = await generate({ model, contents: prompt });
    return response.text;
}

/**
 * Generates a stream of text content from a prompt.
 * @param prompt - The text prompt to send to the model.
 * @param model - The model to use (defaults to 'gemini-flash-lite-latest').
 * @returns A promise that resolves to the streaming response.
 */
export async function generateTextStream(prompt: string, model: string = 'gemini-flash-lite-latest') {
    return generateStream({ model, contents: prompt });
}

/**
 * Generates a full quiz with multiple questions based on a topic.
 * @param subject - The broader subject area.
 * @param topic - The specific topic of the quiz.
 * @param difficulty - The difficulty level ('easy', 'medium', 'hard').
 * @param totalQuestions - The number of questions to generate.
 * @param academicLevel - The academic level of the user.
 * @returns A promise that resolves to an array of generated questions.
 */
export async function generateQuizQuestions(subject: string, topic: string, difficulty: string, totalQuestions: number, academicLevel: string): Promise<any[]> {
    const schema = {
        type: Type.OBJECT,
        properties: {
            questions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                    },
                    required: ['question', 'options', 'correctAnswer', 'explanation'],
                },
            },
        },
        required: ['questions'],
    };

    const prompt = `Generate a quiz with ${totalQuestions} multiple-choice questions about the topic "${topic}" within the broader subject of "${subject}".
    The questions should be appropriate for a student at the "${academicLevel}" level.
    The difficulty should be "${difficulty}".
    Each question must have 4 options.
    The 'correctAnswer' field must exactly match one of the strings in the 'options' array.
    Provide a brief explanation for the correct answer.`;

    const result = await generateJsonContent(prompt, schema);
    if (result && Array.isArray(result.questions)) {
        return result.questions;
    } else {
        // In case the AI doesn't follow the schema, try to find a questions array somewhere.
        const questionsArray = Array.isArray(result) ? result : (result.questions || []);
        if (questionsArray.length > 0) {
            console.warn("AI response format was slightly off, but questions were extracted.");
            return questionsArray;
        }
        throw new Error("AI failed to return questions in the expected format.");
    }
}


/**
 * Generates a single quiz question based on a topic.
 * @param subject - The broader subject area.
 * @param topic - The specific topic of the question.
 * @param difficulty - The difficulty level ('easy', 'medium', 'hard').
 * @param academicLevel - The academic level of the user.
 * @returns A promise that resolves to a single generated question object.
 */
export async function generateSingleQuestion(subject: string, topic: string, difficulty: string, academicLevel: string): Promise<any> {
    const schema = {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
        },
        required: ['question', 'options', 'correctAnswer', 'explanation'],
    };

    const prompt = `Generate a single multiple-choice question about the topic "${topic}" within the broader subject of "${subject}".
    The question should be appropriate for a student at the "${academicLevel}" level.
    The difficulty should be "${difficulty}".
    The question must have 4 options.
    The 'correctAnswer' field must exactly match one of the strings in the 'options' array.
    Provide a brief explanation for the correct answer.`;

    return await generateJsonContent(prompt, schema);
}

/**
 * Generates a set of IQ test questions.
 * @param level - The difficulty level of the questions (0 is easiest).
 * @returns A promise that resolves to an array of 15 generated questions.
 */
export async function generateIQQuestions(level: number): Promise<any[]> {
    const schema = {
        type: Type.OBJECT,
        properties: {
            questions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                    },
                    required: ['question', 'options', 'correctAnswer', 'explanation'],
                },
            },
        },
        required: ['questions'],
    };
    
    const difficultyMap = ['Beginner', 'Easy', 'Intermediate', 'Advanced', 'Hard', 'Expert', 'Genius', 'Master', 'Grandmaster', 'Legendary'];
    const difficulty = difficultyMap[Math.min(level, difficultyMap.length - 1)];

    const prompt = `Generate a set of 15 IQ test-style questions. The difficulty should be "${difficulty}" (corresponding to level ${level}).
    Questions should cover logical reasoning, pattern recognition, spatial puzzles, and abstract thinking.
    Each question must be multiple-choice with 4 options.
    The 'correctAnswer' field must exactly match one of the strings in the 'options' array.
    Provide a brief, clear explanation for the correct answer.`;

    const result = await generateJsonContent(prompt, schema);
     if (result && Array.isArray(result.questions)) {
        return result.questions;
    } else {
        throw new Error("AI failed to return IQ questions in the expected format.");
    }
}