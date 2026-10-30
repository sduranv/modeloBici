# Soporte desmontable para notebook en bicicleta estática

Aplicación web 3D para visualizar, fabricar e instalar un soporte desmontable de melamina en una bicicleta estática semirreclinada LuckySports.

## Ver la aplicación

La versión publicada está disponible en:

**https://sduranv.github.io/modeloBici/**

## Qué incluye

- Modelo 3D interactivo de la bicicleta y el soporte.
- Tutorial animado de montaje e instalación.
- Vistas frontal, lateral, superior e isométrica.
- Planos simplificados, lista de cortes, herrajes y pasos de armado.
- Compatibilidad con notebook de 14 pulgadas o teclado y mouse de 500 × 160 mm.
- Parámetros centralizados para ajustar las medidas antes de cortar.

## Uso local

Requiere Node.js 24 o una versión compatible.

```bash
npm install
npm run dev
```

Para generar la versión de producción:

```bash
npm run build
npm run preview
```

## Medidas que deben confirmarse

Antes de fabricar, hay que medir directamente en la bicicleta:

1. Diámetro del manubrio junto al mástil.
2. Ancho del mástil a la altura de la bandeja.
3. Altura de la punta del mástil sobre el manubrio, sin la consola.

Estas medidas se pueden actualizar en **Planos y fabricación → Detalle técnico y medidas**. El modelo, las ranuras y los planos se recalculan automáticamente.

## Seguridad

El modelo y los cálculos son una guía de fabricación, no una certificación estructural. Antes de colocar el notebook se deben realizar las pruebas físicas indicadas en la sección **Antes de usarlo** de la aplicación.

Las fotografías y videos originales de la bicicleta no forman parte del repositorio público para proteger la privacidad del propietario.
