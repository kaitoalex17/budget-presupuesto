import { BudgetItemInput } from "@/types";

export interface AIBudgetRequest {
  prompt: string;
  projectType?: string;
  targetBudget?: number;
}

export interface AIBudgetResponse {
  suggestedTitle: string;
  suggestedItems: BudgetItemInput[];
  summary: string;
}

/**
 * Módulo extensible para generación de partidas y presupuestos mediante IA.
 * Soporta integración con OpenAI, Gemini o cualquier LLM compatible con API REST.
 * Si no hay API KEY configurada, utiliza generación inteligente por patrones predefinidos.
 */
export async function generateBudgetWithAI(request: AIBudgetRequest): Promise<AIBudgetResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `Eres un experto perito tasador y jefe de obra en España. Tu objetivo es transformar la descripción del cliente en una lista detallada de partidas y conceptos de presupuesto profesional.
Responde estrictamente en formato JSON con la siguiente estructura:
{
  "suggestedTitle": "Título descriptivo del presupuesto",
  "summary": "Breve explicación de la estimación",
  "suggestedItems": [
    {
      "type": "PARTIDA" | "UNIDAD",
      "concept": "Título del concepto",
      "description": "Detalle técnico de los trabajos y materiales",
      "quantity": 1,
      "unitPrice": 500,
      "amount": 500,
      "order": 1
    }
  ]
}`,
            },
            {
              role: "user",
              content: `Genera un presupuesto detallado para el siguiente trabajo: "${request.prompt}"`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        return {
          suggestedTitle: parsed.suggestedTitle || "Presupuesto Generado por IA",
          summary: parsed.summary || "Presupuesto estimado automáticamente con IA.",
          suggestedItems: parsed.suggestedItems.map((item: BudgetItemInput, idx: number) => ({
            type: item.type || "PARTIDA",
            concept: item.concept,
            description: item.description || "",
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            amount: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
            order: idx + 1,
          })),
        };
      }
    } catch (err) {
      console.warn("Fallo en llamada a API de IA externa, recurriendo a generador local:", err);
    }
  }

  // Generador heurístico inteligente local (Fallback sin coste ni dependencia externa)
  const lowerPrompt = request.prompt.toLowerCase();
  const items: BudgetItemInput[] = [];

  if (lowerPrompt.includes("baño") || lowerPrompt.includes("bano") || lowerPrompt.includes("ducha")) {
    items.push(
      {
        type: "PARTIDA",
        concept: "Demolición y desescombro de cuarto de baño",
        description: "Picado de revestimientos cerámicos, retirada de sanitarios antiguos y transporte a vertedero.",
        quantity: 1,
        unitPrice: 580,
        amount: 580,
        order: 1,
      },
      {
        type: "PARTIDA",
        concept: "Instalación de fontanería y desagües",
        description: "Nueva distribución de tuberías multicapa para lavabo, inodoro y ducha con llaves de corte.",
        quantity: 1,
        unitPrice: 720,
        amount: 720,
        order: 2,
      },
      {
        type: "UNIDAD",
        concept: "Alicatado y solado porcelánico",
        description: "Colocación de plaqueta rectificada con mortero cola flexible C2TE y rejuntado hidrófugo.",
        quantity: 22,
        unitPrice: 34,
        amount: 748,
        order: 3,
      },
      {
        type: "PARTIDA",
        concept: "Instalación de sanitarios, grifería y mampara",
        description: "Montaje de plato de ducha de resina, grifería termostática empotrada, inodoro compacto y mueble suspendido.",
        quantity: 1,
        unitPrice: 420,
        amount: 420,
        order: 4,
      }
    );
  } else if (lowerPrompt.includes("cocina")) {
    items.push(
      {
        type: "PARTIDA",
        concept: "Desmontaje de cocina existente y desescombro",
        description: "Retirada de mobiliario anterior, electrodomésticos y azulejos con transporte a punto limpio.",
        quantity: 1,
        unitPrice: 650,
        amount: 650,
        order: 1,
      },
      {
        type: "PARTIDA",
        concept: "Adecuación de fontanería y electricidad cocina",
        description: "Nuevas tomas para electrodomésticos según normativa REBT y acometidas de agua/fregadero.",
        quantity: 1,
        unitPrice: 950,
        amount: 950,
        order: 2,
      },
      {
        type: "UNIDAD",
        concept: "Alicatado en zona de trabajo y pavimento",
        description: "Suministro e instalación de gres porcelánico de alta resistencia.",
        quantity: 28,
        unitPrice: 36,
        amount: 1008,
        order: 3,
      },
      {
        type: "PARTIDA",
        concept: "Montaje y ajuste de mobiliario de cocina",
        description: "Instalación de módulos altos, bajos, encimera e integración de electrodomésticos.",
        quantity: 1,
        unitPrice: 850,
        amount: 850,
        order: 4,
      }
    );
  } else if (lowerPrompt.includes("pint") || lowerPrompt.includes("pared")) {
    items.push(
      {
        type: "UNIDAD",
        concept: "Preparación, saneado y lijado de paramentos",
        description: "Emplastecido de grietas, tapado de agujeros y lijado fino con aspiración.",
        quantity: 120,
        unitPrice: 4.5,
        amount: 540,
        order: 1,
      },
      {
        type: "UNIDAD",
        concept: "Pintura plástica lisa lavable mate de primera calidad",
        description: "Aplicación de dos manos de pintura plástica blanca o color suave, previa imprimación.",
        quantity: 120,
        unitPrice: 8.5,
        amount: 1020,
        order: 2,
      }
    );
  } else {
    // Estimación genérica basada en la descripción
    items.push(
      {
        type: "PARTIDA",
        concept: `Trabajos preparatorios y replanteo: ${request.prompt.slice(0, 40)}`,
        description: "Estudio previo, acopio de materiales y protecciones de zonas de paso.",
        quantity: 1,
        unitPrice: 350,
        amount: 350,
        order: 1,
      },
      {
        type: "UNIDAD",
        concept: "Mano de obra especializada",
        description: "Ejecución de los trabajos solicitados por personal técnico cualificado.",
        quantity: 16,
        unitPrice: 32,
        amount: 512,
        order: 2,
      },
      {
        type: "PARTIDA",
        concept: "Suministro de materiales y remates finales",
        description: "Materiales certificados y limpieza final de entrega.",
        quantity: 1,
        unitPrice: 480,
        amount: 480,
        order: 3,
      }
    );
  }

  return {
    suggestedTitle: `Presupuesto: ${request.prompt.slice(0, 50)}`,
    summary: "Propuesta de partidas generada automáticamente. Puedes editar cualquier importe o concepto.",
    suggestedItems: items,
  };
}
