import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const { scenario } = await request.json();
    
    if (!scenario || scenario.trim().length === 0) {
      return NextResponse.json(
        { error: 'Scenario is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    You are an empathetic AI assistant designed to help users think through their scenarios and situations. 
    
    A user has shared the following scenario with you:
    "${scenario}"
    
    Your task is to generate exactly 5 thoughtful, insightful questions that will help you better understand:
    1. The user's perspective and feelings about the situation
    2. The context and background that led to this scenario
    3. The user's goals, desires, or what they hope to achieve
    4. Any constraints, challenges, or obstacles they're facing
    5. What support, resources, or next steps might be most helpful
    
    Guidelines for your questions:
    - Make them open-ended to encourage detailed responses
    - Be empathetic and supportive in tone
    - Focus on understanding rather than judging
    - Ask about different aspects (emotional, practical, relational, etc.)
    - Avoid yes/no questions
    - Make each question distinct and valuable
    
    Format your response as a JSON object with exactly this structure:
    {
      "questions": [
        "Question 1 here",
        "Question 2 here", 
        "Question 3 here",
        "Question 4 here",
        "Question 5 here"
      ]
    }
    
    Return only the JSON object, no additional text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Clean up the response text by removing markdown code blocks
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('Cleaned response:', cleanText);
      
      // Parse the JSON response
      const parsedResponse = JSON.parse(cleanText);
      
      // Validate that we have exactly 5 questions
      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions) || parsedResponse.questions.length !== 5) {
        throw new Error('Invalid response format');
      }

      return NextResponse.json({
        success: true,
        scenario: scenario,
        questions: parsedResponse.questions
      });

    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.log('Raw response:', text);
      
      // Fallback to manual parsing if JSON parsing fails
      const lines = text.split('\n').filter((line: string) => line.trim().length > 0);
      const questions: string[] = [];
      
      for (const line of lines) {
        if (line.includes('?') && questions.length < 5) {
          // Extract question from line
          let question = line.replace(/^\d+\.?\s*/, '').replace(/^-\s*/, '').trim();
          if (question.includes('"')) {
            question = question.replace(/"/g, '');
          }
          questions.push(question);
        }
      }
      
      if (questions.length === 5) {
        return NextResponse.json({
          success: true,
          scenario: scenario,
          questions: questions
        });
      }
      
      // If all else fails, return generic questions
      return NextResponse.json({
        success: true,
        scenario: scenario,
        questions: [
          "How are you feeling about this situation right now?",
          "What led to this scenario - can you share some background context?",
          "What would an ideal outcome look like for you?",
          "What are the biggest challenges or obstacles you're currently facing?",
          "What kind of support or guidance would be most helpful for you right now?"
        ]
      });
    }

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
