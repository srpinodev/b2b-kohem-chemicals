<?php

namespace App\Adapters\Chatbot;

class FaqChatbotAdapter implements ChatbotGateway
{
    private const RULES = [
        ['keywords' => ['hola', 'buenas', 'buenos', 'buenas', 'hi', 'hello'],
         'reply'    => 'Hola, bienvenido a Kohem Chemicals. ¿En qué puedo ayudarte hoy?'],

        ['keywords' => ['precio', 'precios', 'costo', 'valor', 'cuánto', 'cuanto'],
         'reply'    => 'Los precios están disponibles en el catálogo. Si eres distribuidor, aplican precios especiales según tu categoría.'],

        ['keywords' => ['pedido', 'orden', 'comprar', 'pedir'],
         'reply'    => 'Puedes realizar pedidos desde la sección "Catálogo". Agrega los productos al carrito y confirma tu orden.'],

        ['keywords' => ['factura', 'facturar', 'invoice'],
         'reply'    => 'Las facturas se generan automáticamente al confirmar el pago. Puedes descargarlas en PDF desde "Mis Facturas".'],

        ['keywords' => ['pago', 'pagar', 'tarjeta', 'stripe'],
         'reply'    => 'Aceptamos pagos con tarjeta de crédito/débito a través de Stripe en un entorno seguro.'],

        ['keywords' => ['envío', 'envio', 'despacho', 'entrega', 'tiempo'],
         'reply'    => 'Los tiempos de entrega varían según la ubicación. Tu asesor comercial te confirmará el plazo al confirmar el pedido.'],

        ['keywords' => ['sds', 'ficha', 'seguridad', 'hoja'],
         'reply'    => 'Las hojas de seguridad (SDS) están disponibles en la página de detalle de cada producto.'],

        ['keywords' => ['distribuidor', 'distribuir', 'representante'],
         'reply'    => 'Para registrarte como distribuidor y acceder a precios preferenciales, contacta a nuestro equipo comercial.'],

        ['keywords' => ['contacto', 'asesor', 'vendedor', 'soporte', 'ayuda'],
         'reply'    => 'Puedes contactar a tu asesor comercial directamente. Si no tienes uno asignado, escríbenos a ventas@kohem.co.'],

        ['keywords' => ['gracias', 'listo', 'ok', 'okay', 'perfecto'],
         'reply'    => '¡Con mucho gusto! ¿Hay algo más en lo que pueda ayudarte?'],
    ];

    public function reply(string $message, string $sessionId): ChatbotResponse
    {
        $lower = mb_strtolower($message, 'UTF-8');

        foreach (self::RULES as $rule) {
            foreach ($rule['keywords'] as $keyword) {
                if (str_contains($lower, $keyword)) {
                    return new ChatbotResponse(text: $rule['reply'], sessionId: $sessionId);
                }
            }
        }

        return new ChatbotResponse(
            text: 'No entendí tu consulta. Puedes preguntarme sobre pedidos, precios, facturas, pagos, envíos o fichas de seguridad.',
            sessionId: $sessionId,
        );
    }
}
