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

    const { prompt, decision } = await request.json();
    
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const aiPrompt = `
    You are an expert decision analyst and strategic advisor with deep expertise in scenario planning and outcome prediction.
    
    A user is considering the following situation/decision:
    "${prompt}"
    
    ${decision ? `Specifically, they are thinking about: "${decision}"` : ''}
    
    Your task is to provide a comprehensive analysis of possible outcomes. Generate exactly 3 categories of outcomes:
    1. POSITIVE OUTCOMES - The best-case scenarios and benefits
    2. NEGATIVE OUTCOMES - Potential risks, challenges, and drawbacks  
    3. NEUTRAL/MIXED OUTCOMES - Realistic middle-ground scenarios with both pros and cons
    
    For each category, provide 2-3 specific, detailed outcomes that are:
    - Realistic and grounded in common patterns
    - Specific to the user's situation
    - Actionable (helping them prepare or plan)
    - Balanced in perspective
    - Consider short-term and long-term implications
    
    Guidelines for your analysis:
    - Be objective and realistic, not overly optimistic or pessimistic
    - Consider multiple timeframes (immediate, short-term, long-term)
    - Include both tangible and intangible consequences
    - Consider impact on relationships, finances, career, personal growth, etc.
    - Provide insights that help with decision-making
    
    Format your response as a JSON object with exactly this structure:
    {
      "analysis_summary": "Brief 1-2 sentence overview of the decision context",
      "positive_outcomes": [
        "Detailed positive outcome 1",
        "Detailed positive outcome 2", 
        "Detailed positive outcome 3"
      ],
      "negative_outcomes": [
        "Detailed negative outcome 1",
        "Detailed negative outcome 2",
        "Detailed negative outcome 3"
      ],
      "neutral_mixed_outcomes": [
        "Detailed mixed outcome 1",
        "Detailed mixed outcome 2",
        "Detailed mixed outcome 3"
      ],
      "key_considerations": [
        "Important factor to consider 1",
        "Important factor to consider 2",
        "Important factor to consider 3"
      ],
      "recommendations": "Brief advice on how to approach this decision or maximize positive outcomes"
    }
    
    Return only the JSON object, no additional text.
    `;

    const result = await model.generateContent(aiPrompt);
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
      
      // Validate response structure
      if (!parsedResponse.positive_outcomes || 
          !parsedResponse.negative_outcomes || 
          !parsedResponse.neutral_mixed_outcomes ||
          !Array.isArray(parsedResponse.positive_outcomes) ||
          !Array.isArray(parsedResponse.negative_outcomes) ||
          !Array.isArray(parsedResponse.neutral_mixed_outcomes)) {
        throw new Error('Invalid response format');
      }

      return NextResponse.json({
        success: true,
        prompt: prompt,
        decision: decision || null,
        analysis: parsedResponse
      });

    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.log('Raw response:', text);
      
      // Fallback response if JSON parsing fails
      return NextResponse.json({
        success: true,
        prompt: prompt,
        decision: decision || null,
        analysis: {
          analysis_summary: "Analysis of potential outcomes for your decision.",
          positive_outcomes: [
            "You may experience personal growth and learning from taking action",
            "This decision could lead to new opportunities and connections", 
            "Successfully navigating this choice may boost your confidence"
          ],
          negative_outcomes: [
            "There may be unexpected challenges or setbacks along the way",
            "The decision might require more time, energy, or resources than anticipated",
            "Some relationships or current situations might be affected"
          ],
          neutral_mixed_outcomes: [
            "The outcome will likely be a mix of positive and challenging experiences",
            "You may find that the result is different from what you initially expected",
            "The decision may lead to other choices and decisions down the road"
          ],
          key_considerations: [
            "Consider your values and long-term goals when making this decision",
            "Think about what support systems or resources you might need",
            "Evaluate your risk tolerance and backup plans"
          ],
          recommendations: "Take time to reflect on your priorities, seek advice from trusted sources, and consider starting with small steps to test your decision before fully committing."
        }
      });
    }

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to predict outcomes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}