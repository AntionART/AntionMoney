import { useEffect, useRef, useState } from 'react';

/**
 * Anima un número entero hacia su nuevo valor en ~400ms (ease-out corto),
 * como pide la sección de microinteracciones: "el disponible se actualiza
 * con un conteo animado corto".
 */
export function useCountUp(valorObjetivo: number, duracionMs = 400): number {
  const [valorMostrado, setValorMostrado] = useState(valorObjetivo);
  const valorInicial = useRef(valorObjetivo);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const desde = valorInicial.current;
    const hasta = valorObjetivo;
    if (desde === hasta) return;

    const inicio = Date.now();
    const tick = () => {
      const progreso = Math.min(1, (Date.now() - inicio) / duracionMs);
      const facilitado = 1 - Math.pow(1 - progreso, 2); // ease-out
      setValorMostrado(Math.round(desde + (hasta - desde) * facilitado));
      if (progreso < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        valorInicial.current = hasta;
      }
    };
    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [valorObjetivo, duracionMs]);

  return valorMostrado;
}
