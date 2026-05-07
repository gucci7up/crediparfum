import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import './index.css';

function App() {
  const [gravityActive, setGravityActive] = useState(false);
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const elementsRef = useRef({});

  // Elements definitions
  const uiElements = [
    { id: 'logo', className: 'google-logo', content: (
      <>
        <span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>
      </>
    ) },
    { id: 'search', className: 'search-bar', type: 'input', placeholder: 'Buscar en Google' },
    { id: 'btn1', className: 'btn', content: 'Buscar con Google' },
    { id: 'btn2', className: 'btn', content: 'Voy a tener suerte' }
  ];

  const logInteraction = async () => {
    try {
      // Ajustar la URL a donde esté alojado el backend
      // Para pruebas locales, podría ser http://localhost:8080/api.php
      // Asumiremos que está en la misma red o puerto configurado
      const backendUrl = 'http://localhost/api.php'; // Cambiar en prod
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ event_type: 'anti_gravity_activated' })
      });
      const data = await response.json();
      console.log('Interacción registrada:', data);
    } catch (error) {
      console.error('Error registrando interacción:', error);
    }
  };

  const activateGravity = () => {
    if (gravityActive) return;
    setGravityActive(true);
    logInteraction();

    // Inicializar Matter.js
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint;

    const engine = Engine.create();
    // Anti-gravedad (hacia arriba)
    engine.world.gravity.y = -1;
    engineRef.current = engine;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Crear renderizador (opcional, lo hacemos transparente para ver el DOM)
    const render = Render.create({
      element: containerRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent'
      }
    });

    // Limites de la pantalla (Paredes)
    const wallOptions = { isStatic: true, render: { visible: false } };
    const ground = Bodies.rectangle(width / 2, height + 50, width, 100, wallOptions);
    const ceiling = Bodies.rectangle(width / 2, -50, width, 100, wallOptions);
    const leftWall = Bodies.rectangle(-50, height / 2, 100, height, wallOptions);
    const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height, wallOptions);

    Composite.add(engine.world, [ground, ceiling, leftWall, rightWall]);

    // Crear cuerpos físicos basados en los elementos DOM
    const domBodies = [];
    
    uiElements.forEach(item => {
      const el = elementsRef.current[item.id];
      if (!el) return;
      
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      const body = Bodies.rectangle(x, y, rect.width, rect.height, {
        restitution: 0.8, // Rebote
        render: { visible: false } // Ocultamos el cuerpo de matter.js para mostrar el DOM
      });

      // Guardar referencia del body en el elemento DOM
      el.matterBody = body;
      domBodies.push(body);
      
      // Ajustar estilos del DOM para que floten
      el.style.position = 'absolute';
      el.style.margin = '0'; // quitar márgenes para alineación exacta
      el.style.top = '0';
      el.style.left = '0';
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
    });

    Composite.add(engine.world, domBodies);

    // Agregar interactividad con el ratón
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });

    Composite.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    Render.run(render);
    
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Bucle para actualizar posiciones del DOM
    const updateDOM = () => {
      uiElements.forEach(item => {
        const el = elementsRef.current[item.id];
        if (el && el.matterBody) {
          const { position, angle } = el.matterBody;
          el.style.transform = `translate(${position.x - el.offsetWidth / 2}px, ${position.y - el.offsetHeight / 2}px) rotate(${angle}rad)`;
        }
      });
      requestAnimationFrame(updateDOM);
    };

    updateDOM();
  };

  return (
    <div className="app">
      <div ref={containerRef} className="matter-canvas" style={{ pointerEvents: gravityActive ? 'auto' : 'none' }}></div>
      
      <div className="google-container" onClick={!gravityActive ? activateGravity : undefined}>
        {uiElements.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            {item.type === 'input' ? (
              <input
                ref={el => elementsRef.current[item.id] = el}
                className={item.className}
                placeholder={item.placeholder}
                onClick={(e) => {
                  if (!gravityActive) {
                    e.stopPropagation(); // Evitar activar gravedad si solo se quiere escribir al inicio
                  }
                }}
              />
            ) : (
              <div
                ref={el => elementsRef.current[item.id] = el}
                className={item.className}
              >
                {item.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
