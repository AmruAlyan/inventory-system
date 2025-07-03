# LocatorJS Setup Guide (Data-ID Approach)

## What is LocatorJS?
LocatorJS is a developer tool that allows you to click on any UI component in your browser and automatically opens the source code in your IDE. It's especially useful for debugging and understanding component hierarchy in React applications.

## Setup Completed ✅

### 1. Installed Dependencies
- `@locator/runtime` - The core LocatorJS runtime
- `@locator/babel-jsx` - Babel plugin that adds data attributes to components for source mapping

### 2. Configuration Added

#### main.jsx
```jsx
import setupLocatorUI from "@locator/runtime";

// Setup LocatorJS for development
if (import.meta.env.DEV) {
  setupLocatorUI();
}
```

#### vite.config.js
```js
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ["@locator/babel-jsx/dist", {
            env: "development",
          }]
        ]
      }
    })
  ],
  server: {
    host: true
  },
})
```

**Note**: This setup uses the **data-id approach** which adds special data attributes to components, making them detectable by LocatorJS.

## How to Use LocatorJS

### Method 1: Browser Extension (Recommended)
1. Install the LocatorJS browser extension:
   - [Chrome/Edge/Brave/Opera](https://chrome.google.com/webstore/detail/locatorjs/npbfdllefekhdplbkdigpncggmojpefi)
   - [Firefox](https://addons.mozilla.org/en/firefox/addon/locatorjs/)

2. Once installed, you can:
   - **Option/Alt + Click** on any component to open it in your IDE
   - Right-click and select "Open in IDE" from the context menu

### Method 2: Library Setup (Already Done)
The library setup is already completed in your project. It will work automatically in development mode.

## How It Works

1. **Source Mapping**: The Babel plugins add source location information to your React components
2. **Runtime Detection**: The LocatorJS runtime detects clicks and component boundaries
3. **IDE Integration**: When you click a component, it sends a request to open the file in your default IDE

## Troubleshooting

### If LocatorJS doesn't work:

1. **Make sure you're in development mode**:
   - Check that `npm run dev` is running
   - Verify the URL is `localhost:5173` (development server)

2. **Install the browser extension**:
   - The extension is the most reliable way to use LocatorJS

3. **Check console for errors**:
   - Open browser DevTools (F12)
   - Look for any LocatorJS related errors in the console

4. **Verify IDE integration**:
   - Make sure your IDE (VS Code, WebStorm, etc.) is running
   - Some IDEs may require additional configuration

### Common Issues:

- **"No source info found"**: This usually means the Babel plugin isn't working. Make sure `@locator/babel-jsx` is installed and properly configured in your Vite config
- **Components not clickable**: Try using the browser extension or make sure the development server is running
- **IDE doesn't open**: Check your default IDE settings and ensure it's running
- **Plugin conflicts**: If you see errors, make sure only the LocatorJS Babel plugin is configured, not multiple source mapping plugins

## Features

- **Component Detection**: Automatically detects React component boundaries
- **Source Navigation**: Jumps directly to the component definition in your IDE
- **Props Inspection**: Shows component props and state information
- **Parent Navigation**: Navigate through component hierarchy

## Development Only

LocatorJS is configured to only run in development mode (`import.meta.env.DEV`), so it won't affect your production builds.

## Next Steps

1. Install the browser extension for the best experience
2. Try **Option/Alt + Click** on any component in your Categories page
3. The component source code should open directly in VS Code

## Links

- [LocatorJS Official Website](https://www.locatorjs.com/)
- [GitHub Repository](https://github.com/infi-pc/locatorjs)
- [Chrome Extension](https://chrome.google.com/webstore/detail/locatorjs/npbfdllefekhdplbkdigpncggmojpefi)
