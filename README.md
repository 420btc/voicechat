# AI Voice Chat 🎤💬

Una aplicación de chat con IA que soporta tanto entrada de voz como texto, construida con Next.js y TypeScript.

## 🚀 Características

### ✅ Implementadas
- **Chat por voz**: Grabación y transcripción en tiempo real
- **Chat por texto**: Interfaz de texto tradicional
- **Múltiples proveedores de IA**: OpenAI, Anthropic, Gemini, DeepSeek, Grok
- **Gestión de conversaciones**: Guardar, cargar, eliminar y buscar conversaciones
- **Limpieza de duplicados**: Detecta y elimina conversaciones duplicadas
- **Temas personalizables**: Modo claro/oscuro con múltiples variantes
- **Perfil de usuario**: Personalización de nombre y avatar
- **Subida de archivos**: Soporte para imágenes y PDFs
- **Visualizador de código**: Syntax highlighting y copia de código
- **Atajos de teclado**: Navegación rápida
- **Auto-guardado**: Guardado automático de conversaciones
- **Modo compacto**: Interfaz optimizada
- **Notificaciones**: Sistema de alertas y mensajes
- **Búsqueda avanzada**: Filtros por proveedor, fecha y contenido

### 🔄 Posibles Mejoras Futuras

#### 🎯 Funcionalidades Core
- [ ] **Streaming de respuestas**: Mostrar respuestas de IA en tiempo real
- [ ] **Historial de voz**: Reproducir grabaciones de audio anteriores
- [ ] **Exportación de conversaciones**: PDF, TXT, JSON
- [ ] **Importación de conversaciones**: Cargar chats desde archivos
- [ ] **Conversaciones colaborativas**: Compartir chats con otros usuarios

#### 🎨 Interfaz y UX
- [ ] **Responsive móvil mejorado**: Optimización completa para dispositivos móviles
- [ ] **Arrastrar y soltar**: Mejores interacciones para archivos
- [ ] **Vista previa de archivos**: Previsualización antes de enviar
- [ ] **Emoji picker**: Selector de emojis integrado
- [ ] **Markdown avanzado**: Soporte completo para tablas, matemáticas
- [ ] **Temas personalizados**: Editor de temas visual

#### 🔧 Funcionalidades Técnicas
- [ ] **Caché inteligente**: Optimización de rendimiento
- [ ] **Offline mode**: Funcionalidad sin conexión
- [ ] **PWA**: Aplicación web progresiva
- [ ] **Sincronización en la nube**: Backup automático
- [ ] **API REST**: Endpoints para integración externa
- [ ] **Webhooks**: Notificaciones automáticas

#### 🤖 IA y ML
- [ ] **Modelos locales**: Soporte para LLMs locales (Ollama)
- [ ] **Análisis de sentimientos**: Detección de emociones
- [ ] **Resumen automático**: Resúmenes de conversaciones largas
- [ ] **Traducción automática**: Soporte multiidioma
- [ ] **Reconocimiento de imágenes**: Análisis avanzado de imágenes
- [ ] **Generación de imágenes**: Integración con DALL-E, Midjourney

#### 🔐 Seguridad y Privacidad
- [ ] **Encriptación E2E**: Cifrado de extremo a extremo
- [ ] **Autenticación**: Login con Google, GitHub, etc.
- [ ] **Roles y permisos**: Sistema de usuarios avanzado
- [ ] **Auditoría**: Logs de actividad
- [ ] **GDPR compliance**: Cumplimiento de privacidad

#### 📊 Analytics y Monitoreo
- [ ] **Dashboard de uso**: Estadísticas de conversaciones
- [ ] **Métricas de rendimiento**: Tiempo de respuesta, errores
- [ ] **A/B Testing**: Pruebas de funcionalidades
- [ ] **Feedback system**: Sistema de valoraciones

## 🛠️ Instalación

### Prerrequisitos
- Node.js 18+
- npm, yarn o pnpm

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/ai-voice-chat.git
cd ai-voice-chat
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
# o
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Edita `.env.local` y añade tus API keys:
```env
OPENAI_API_KEY=tu_api_key_aqui
ANTHROPIC_API_KEY=tu_api_key_aqui
GEMINI_API_KEY=tu_api_key_aqui
# ... otros proveedores
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

5. **Abrir en el navegador**
```
http://localhost:3000
```

## 🚀 Uso

### Configuración Inicial
1. Configura tus API keys en la sección de configuración
2. Selecciona tu proveedor de IA preferido
3. Personaliza tu perfil de usuario

### Chat por Voz
1. Haz clic en el botón del micrófono
2. Habla claramente
3. La transcripción aparecerá en tiempo real
4. Haz clic en enviar o presiona Enter

### Chat por Texto
1. Escribe tu mensaje en el campo de texto
2. Presiona Enter o haz clic en enviar
3. Puedes adjuntar archivos arrastrándolos

### Gestión de Conversaciones
- **Guardar**: Las conversaciones se guardan automáticamente
- **Buscar**: Usa la barra de búsqueda para encontrar chats
- **Filtrar**: Filtra por proveedor, fecha o contenido
- **Limpiar duplicados**: Usa el botón de limpieza en el gestor

## 🏗️ Arquitectura

### Tecnologías
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Estado**: React Hooks, Context API
- **Audio**: Web Audio API, MediaRecorder
- **Almacenamiento**: localStorage

### Estructura del Proyecto
```
├── app/                 # App Router de Next.js
│   ├── api/            # API routes para cada proveedor
│   ├── globals.css     # Estilos globales
│   ├── layout.tsx      # Layout principal
│   └── page.tsx        # Página principal
├── components/         # Componentes React
│   ├── ui/            # Componentes de UI base
│   └── ...            # Componentes específicos
├── hooks/             # Custom hooks
├── lib/               # Utilidades y helpers
├── public/            # Archivos estáticos
└── styles/            # Estilos adicionales
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - Framework de React
- [Tailwind CSS](https://tailwindcss.com/) - Framework de CSS
- [Radix UI](https://www.radix-ui.com/) - Componentes primitivos
- [Lucide](https://lucide.dev/) - Iconos
- Todos los proveedores de IA por sus APIs

---

**¿Encontraste un bug o tienes una sugerencia?** 
Abre un [issue](https://github.com/tu-usuario/ai-voice-chat/issues) o contribuye con un PR. ¡Toda ayuda es bienvenida! 🚀