# ⚛️ 3D Management Frontend

A premium, state-of-the-art dashboard built with React 19 and Tailwind 4. Designed for visual excellence and peak usability in managing 3D printing workflows.

## 🛠 Tech Stack

- **Core**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [React Query](https://tanstack.com/query/latest)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Components**: Radix UI + Custom Glassmorphism System
- **Package Manager**: [Bun](https://bun.sh/)

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed (`curl -fsSL https://bun.sh/install | bash`)

### Local Installation

1. **Install Dependencies**:

    ```bash
    bun install
    ```

2. **Environment Variables**:
    Create a `.env` file in the `frontend` directory:

    ```env
    VITE_API_BASE_URL=http://localhost:8000
    ```

3. **Run Development Server**:

    ```bash
    bun run dev
    ```

## 🎨 Design System

The application uses a custom-built design system focused on:

- **Glassmorphism**: Subtle translucent backgrounds for a modern "premium" feel.
- **Micro-animations**: Smooth transitions for modals, hover states, and loading indicators.
- **Dynamic Colors**: Filament colors are rendered using real-time database hex codes with visual swatches.

## 📁 Component Architecture

- **`src/components/stock/`**: Specialized inventory components (Summary cards, search bar, filament cards).
- **`src/components/ui/`**: Reusable base components (Buttons, Inputs, Modals).
- **`src/components/jobs/`**: Print job management components.
- **`src/components/printer/`**: Real-time printer terminal and status views.
- **`src/pages/`**: Main application views (Dashboard, Filament Stock, Settings, Jobs, Printer, Library).

## 🧪 Quality Control

- **Linting**: `bun run lint`
- **Build Check**: `bun run build`
- **Format Check**: `bun run format` (if configured)

## 📦 Production Build

To generate a production bundle:

```bash
bun run build
```

The output will be in the `dist/` directory.
