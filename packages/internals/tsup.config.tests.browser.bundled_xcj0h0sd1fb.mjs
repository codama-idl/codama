// ../internals/tsup.config.tests.browser.ts
import { defineConfig } from "tsup";

// ../internals/getBuildConfig.ts
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "node:process";
import browsersListToEsBuild from "browserslist-to-esbuild";
var __injected_dirname__ = "/Users/loris/Code/@kinobi/kinobi/packages/internals";
var BROWSERSLIST_TARGETS = browsersListToEsBuild();
function getBuildConfig(options) {
  const { format, platform } = options;
  return {
    define: {
      __BROWSER__: `${platform === "browser"}`,
      __NODEJS__: `${platform === "node"}`,
      __REACTNATIVE__: `${platform === "react-native"}`,
      __VERSION__: `"${env.npm_package_version}"`
    },
    entry: [`./src/index.ts`],
    esbuildOptions(options2, context) {
      options2.inject = [path.resolve(__injected_dirname__, "env-shim.ts")];
      if (context.format === "iife") {
        options2.define = { ...options2.define, __DEV__: `false` };
        options2.target = BROWSERSLIST_TARGETS;
        options2.minify = true;
      }
    },
    external: ["node:fs", "node:path", "node:url"],
    format,
    globalName: "globalThis.kinobi",
    name: platform,
    // Inline private, non-published packages.
    // WARNING: This inlines packages recursively. Make sure these don't have deep dep trees.
    noExternal: [
      // @noble/hashes/sha256 is an ESM-only module, so we have to inline it in CJS builds.
      ...format === "cjs" ? ["@noble/hashes/sha256", "@noble/hashes/crypto"] : []
    ],
    outExtension({ format: format2 }) {
      const extension = format2 === "iife" ? `.production.min.js` : `.${platform}.${format2 === "cjs" ? "cjs" : "mjs"}`;
      return { js: extension };
    },
    platform: platform === "node" ? "node" : "browser",
    publicDir: true,
    pure: ["process"],
    sourcemap: format !== "iife",
    treeshake: true
  };
}
function getTestsBuildConfig(options) {
  const { format, platform } = options;
  function outExtension() {
    return { js: ".js" };
  }
  return [
    {
      ...getBuildConfig(options),
      outDir: `./dist/tests-${platform}-${format}/src`,
      outExtension
    },
    {
      ...getBuildConfig(options),
      bundle: false,
      entry: ["./test/**/*.ts"],
      async onSuccess() {
        if (format === "esm") {
          await writeFile(`./dist/tests-${platform}-${format}/package.json`, '{ "type": "commonjs" }');
        }
      },
      outDir: `./dist/tests-${platform}-${format}/test`,
      outExtension
    }
  ];
}

// ../internals/tsup.config.tests.browser.ts
var tsup_config_tests_browser_default = defineConfig([
  ...getTestsBuildConfig({ format: "cjs", platform: "browser" }),
  ...getTestsBuildConfig({ format: "esm", platform: "browser" })
]);
export {
  tsup_config_tests_browser_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vaW50ZXJuYWxzL3RzdXAuY29uZmlnLnRlc3RzLmJyb3dzZXIudHMiLCAiLi4vaW50ZXJuYWxzL2dldEJ1aWxkQ29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX2luamVjdGVkX2ZpbGVuYW1lX18gPSBcIi9Vc2Vycy9sb3Jpcy9Db2RlL0BraW5vYmkva2lub2JpL3BhY2thZ2VzL2ludGVybmFscy90c3VwLmNvbmZpZy50ZXN0cy5icm93c2VyLnRzXCI7Y29uc3QgX19pbmplY3RlZF9kaXJuYW1lX18gPSBcIi9Vc2Vycy9sb3Jpcy9Db2RlL0BraW5vYmkva2lub2JpL3BhY2thZ2VzL2ludGVybmFsc1wiO2NvbnN0IF9faW5qZWN0ZWRfaW1wb3J0X21ldGFfdXJsX18gPSBcImZpbGU6Ly8vVXNlcnMvbG9yaXMvQ29kZS9Aa2lub2JpL2tpbm9iaS9wYWNrYWdlcy9pbnRlcm5hbHMvdHN1cC5jb25maWcudGVzdHMuYnJvd3Nlci50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3RzdXAnO1xuXG5pbXBvcnQgeyBnZXRUZXN0c0J1aWxkQ29uZmlnIH0gZnJvbSAnLi9nZXRCdWlsZENvbmZpZyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyhbXG4gICAgLi4uZ2V0VGVzdHNCdWlsZENvbmZpZyh7IGZvcm1hdDogJ2NqcycsIHBsYXRmb3JtOiAnYnJvd3NlcicgfSksXG4gICAgLi4uZ2V0VGVzdHNCdWlsZENvbmZpZyh7IGZvcm1hdDogJ2VzbScsIHBsYXRmb3JtOiAnYnJvd3NlcicgfSksXG5dKTtcbiIsICJjb25zdCBfX2luamVjdGVkX2ZpbGVuYW1lX18gPSBcIi9Vc2Vycy9sb3Jpcy9Db2RlL0BraW5vYmkva2lub2JpL3BhY2thZ2VzL2ludGVybmFscy9nZXRCdWlsZENvbmZpZy50c1wiO2NvbnN0IF9faW5qZWN0ZWRfZGlybmFtZV9fID0gXCIvVXNlcnMvbG9yaXMvQ29kZS9Aa2lub2JpL2tpbm9iaS9wYWNrYWdlcy9pbnRlcm5hbHNcIjtjb25zdCBfX2luamVjdGVkX2ltcG9ydF9tZXRhX3VybF9fID0gXCJmaWxlOi8vL1VzZXJzL2xvcmlzL0NvZGUvQGtpbm9iaS9raW5vYmkvcGFja2FnZXMvaW50ZXJuYWxzL2dldEJ1aWxkQ29uZmlnLnRzXCI7aW1wb3J0IHsgd3JpdGVGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgZW52IH0gZnJvbSAnbm9kZTpwcm9jZXNzJztcblxuaW1wb3J0IGJyb3dzZXJzTGlzdFRvRXNCdWlsZCBmcm9tICdicm93c2Vyc2xpc3QtdG8tZXNidWlsZCc7XG5pbXBvcnQgeyBGb3JtYXQsIE9wdGlvbnMgYXMgVHN1cENvbmZpZyB9IGZyb20gJ3RzdXAnO1xuXG50eXBlIFBsYXRmb3JtID0gJ2Jyb3dzZXInIHwgJ25vZGUnIHwgJ3JlYWN0LW5hdGl2ZSc7XG5cbnR5cGUgQnVpbGRPcHRpb25zID0ge1xuICAgIGZvcm1hdDogRm9ybWF0O1xuICAgIHBsYXRmb3JtOiBQbGF0Zm9ybTtcbn07XG5cbmNvbnN0IEJST1dTRVJTTElTVF9UQVJHRVRTID0gYnJvd3NlcnNMaXN0VG9Fc0J1aWxkKCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCdWlsZENvbmZpZyhvcHRpb25zOiBCdWlsZE9wdGlvbnMpOiBUc3VwQ29uZmlnIHtcbiAgICBjb25zdCB7IGZvcm1hdCwgcGxhdGZvcm0gfSA9IG9wdGlvbnM7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZGVmaW5lOiB7XG4gICAgICAgICAgICBfX0JST1dTRVJfXzogYCR7cGxhdGZvcm0gPT09ICdicm93c2VyJ31gLFxuICAgICAgICAgICAgX19OT0RFSlNfXzogYCR7cGxhdGZvcm0gPT09ICdub2RlJ31gLFxuICAgICAgICAgICAgX19SRUFDVE5BVElWRV9fOiBgJHtwbGF0Zm9ybSA9PT0gJ3JlYWN0LW5hdGl2ZSd9YCxcbiAgICAgICAgICAgIF9fVkVSU0lPTl9fOiBgXCIke2Vudi5ucG1fcGFja2FnZV92ZXJzaW9ufVwiYCxcbiAgICAgICAgfSxcbiAgICAgICAgZW50cnk6IFtgLi9zcmMvaW5kZXgudHNgXSxcbiAgICAgICAgZXNidWlsZE9wdGlvbnMob3B0aW9ucywgY29udGV4dCkge1xuICAgICAgICAgICAgb3B0aW9ucy5pbmplY3QgPSBbcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2Vudi1zaGltLnRzJyldO1xuICAgICAgICAgICAgaWYgKGNvbnRleHQuZm9ybWF0ID09PSAnaWlmZScpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmRlZmluZSA9IHsgLi4ub3B0aW9ucy5kZWZpbmUsIF9fREVWX186IGBmYWxzZWAgfTtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnRhcmdldCA9IEJST1dTRVJTTElTVF9UQVJHRVRTO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMubWluaWZ5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZXh0ZXJuYWw6IFsnbm9kZTpmcycsICdub2RlOnBhdGgnLCAnbm9kZTp1cmwnXSxcbiAgICAgICAgZm9ybWF0LFxuICAgICAgICBnbG9iYWxOYW1lOiAnZ2xvYmFsVGhpcy5raW5vYmknLFxuICAgICAgICBuYW1lOiBwbGF0Zm9ybSxcbiAgICAgICAgLy8gSW5saW5lIHByaXZhdGUsIG5vbi1wdWJsaXNoZWQgcGFja2FnZXMuXG4gICAgICAgIC8vIFdBUk5JTkc6IFRoaXMgaW5saW5lcyBwYWNrYWdlcyByZWN1cnNpdmVseS4gTWFrZSBzdXJlIHRoZXNlIGRvbid0IGhhdmUgZGVlcCBkZXAgdHJlZXMuXG4gICAgICAgIG5vRXh0ZXJuYWw6IFtcbiAgICAgICAgICAgIC8vIEBub2JsZS9oYXNoZXMvc2hhMjU2IGlzIGFuIEVTTS1vbmx5IG1vZHVsZSwgc28gd2UgaGF2ZSB0byBpbmxpbmUgaXQgaW4gQ0pTIGJ1aWxkcy5cbiAgICAgICAgICAgIC4uLihmb3JtYXQgPT09ICdjanMnID8gWydAbm9ibGUvaGFzaGVzL3NoYTI1NicsICdAbm9ibGUvaGFzaGVzL2NyeXB0byddIDogW10pLFxuICAgICAgICBdLFxuICAgICAgICBvdXRFeHRlbnNpb24oeyBmb3JtYXQgfSkge1xuICAgICAgICAgICAgY29uc3QgZXh0ZW5zaW9uID1cbiAgICAgICAgICAgICAgICBmb3JtYXQgPT09ICdpaWZlJyA/IGAucHJvZHVjdGlvbi5taW4uanNgIDogYC4ke3BsYXRmb3JtfS4ke2Zvcm1hdCA9PT0gJ2NqcycgPyAnY2pzJyA6ICdtanMnfWA7XG4gICAgICAgICAgICByZXR1cm4geyBqczogZXh0ZW5zaW9uIH07XG4gICAgICAgIH0sXG4gICAgICAgIHBsYXRmb3JtOiBwbGF0Zm9ybSA9PT0gJ25vZGUnID8gJ25vZGUnIDogJ2Jyb3dzZXInLFxuICAgICAgICBwdWJsaWNEaXI6IHRydWUsXG4gICAgICAgIHB1cmU6IFsncHJvY2VzcyddLFxuICAgICAgICBzb3VyY2VtYXA6IGZvcm1hdCAhPT0gJ2lpZmUnLFxuICAgICAgICB0cmVlc2hha2U6IHRydWUsXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRlc3RzQnVpbGRDb25maWcob3B0aW9uczogQnVpbGRPcHRpb25zKTogVHN1cENvbmZpZ1tdIHtcbiAgICBjb25zdCB7IGZvcm1hdCwgcGxhdGZvcm0gfSA9IG9wdGlvbnM7XG4gICAgZnVuY3Rpb24gb3V0RXh0ZW5zaW9uKCkge1xuICAgICAgICByZXR1cm4geyBqczogJy5qcycgfTtcbiAgICB9XG4gICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgICAgLi4uZ2V0QnVpbGRDb25maWcob3B0aW9ucyksXG4gICAgICAgICAgICBvdXREaXI6IGAuL2Rpc3QvdGVzdHMtJHtwbGF0Zm9ybX0tJHtmb3JtYXR9L3NyY2AsXG4gICAgICAgICAgICBvdXRFeHRlbnNpb24sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIC4uLmdldEJ1aWxkQ29uZmlnKG9wdGlvbnMpLFxuICAgICAgICAgICAgYnVuZGxlOiBmYWxzZSxcbiAgICAgICAgICAgIGVudHJ5OiBbJy4vdGVzdC8qKi8qLnRzJ10sXG4gICAgICAgICAgICBhc3luYyBvblN1Y2Nlc3MoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ2VzbScpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgd3JpdGVGaWxlKGAuL2Rpc3QvdGVzdHMtJHtwbGF0Zm9ybX0tJHtmb3JtYXR9L3BhY2thZ2UuanNvbmAsICd7IFwidHlwZVwiOiBcImNvbW1vbmpzXCIgfScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXREaXI6IGAuL2Rpc3QvdGVzdHMtJHtwbGF0Zm9ybX0tJHtmb3JtYXR9L3Rlc3RgLFxuICAgICAgICAgICAgb3V0RXh0ZW5zaW9uLFxuICAgICAgICB9LFxuICAgIF07XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW1VLFNBQVMsb0JBQW9COzs7QUNBbkQsU0FBUyxpQkFBaUI7QUFDdlUsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsV0FBVztBQUVwQixPQUFPLDJCQUEyQjtBQUpvRSxJQUFNLHVCQUF1QjtBQWNuSSxJQUFNLHVCQUF1QixzQkFBc0I7QUFFNUMsU0FBUyxlQUFlLFNBQW1DO0FBQzlELFFBQU0sRUFBRSxRQUFRLFNBQVMsSUFBSTtBQUM3QixTQUFPO0FBQUEsSUFDSCxRQUFRO0FBQUEsTUFDSixhQUFhLEdBQUcsYUFBYSxTQUFTO0FBQUEsTUFDdEMsWUFBWSxHQUFHLGFBQWEsTUFBTTtBQUFBLE1BQ2xDLGlCQUFpQixHQUFHLGFBQWEsY0FBYztBQUFBLE1BQy9DLGFBQWEsSUFBSSxJQUFJLG1CQUFtQjtBQUFBLElBQzVDO0FBQUEsSUFDQSxPQUFPLENBQUMsZ0JBQWdCO0FBQUEsSUFDeEIsZUFBZUEsVUFBUyxTQUFTO0FBQzdCLE1BQUFBLFNBQVEsU0FBUyxDQUFDLEtBQUssUUFBUSxzQkFBVyxhQUFhLENBQUM7QUFDeEQsVUFBSSxRQUFRLFdBQVcsUUFBUTtBQUMzQixRQUFBQSxTQUFRLFNBQVMsRUFBRSxHQUFHQSxTQUFRLFFBQVEsU0FBUyxRQUFRO0FBQ3ZELFFBQUFBLFNBQVEsU0FBUztBQUNqQixRQUFBQSxTQUFRLFNBQVM7QUFBQSxNQUNyQjtBQUFBLElBQ0o7QUFBQSxJQUNBLFVBQVUsQ0FBQyxXQUFXLGFBQWEsVUFBVTtBQUFBLElBQzdDO0FBQUEsSUFDQSxZQUFZO0FBQUEsSUFDWixNQUFNO0FBQUE7QUFBQTtBQUFBLElBR04sWUFBWTtBQUFBO0FBQUEsTUFFUixHQUFJLFdBQVcsUUFBUSxDQUFDLHdCQUF3QixzQkFBc0IsSUFBSSxDQUFDO0FBQUEsSUFDL0U7QUFBQSxJQUNBLGFBQWEsRUFBRSxRQUFBQyxRQUFPLEdBQUc7QUFDckIsWUFBTSxZQUNGQSxZQUFXLFNBQVMsdUJBQXVCLElBQUksUUFBUSxJQUFJQSxZQUFXLFFBQVEsUUFBUSxLQUFLO0FBQy9GLGFBQU8sRUFBRSxJQUFJLFVBQVU7QUFBQSxJQUMzQjtBQUFBLElBQ0EsVUFBVSxhQUFhLFNBQVMsU0FBUztBQUFBLElBQ3pDLFdBQVc7QUFBQSxJQUNYLE1BQU0sQ0FBQyxTQUFTO0FBQUEsSUFDaEIsV0FBVyxXQUFXO0FBQUEsSUFDdEIsV0FBVztBQUFBLEVBQ2Y7QUFDSjtBQUVPLFNBQVMsb0JBQW9CLFNBQXFDO0FBQ3JFLFFBQU0sRUFBRSxRQUFRLFNBQVMsSUFBSTtBQUM3QixXQUFTLGVBQWU7QUFDcEIsV0FBTyxFQUFFLElBQUksTUFBTTtBQUFBLEVBQ3ZCO0FBQ0EsU0FBTztBQUFBLElBQ0g7QUFBQSxNQUNJLEdBQUcsZUFBZSxPQUFPO0FBQUEsTUFDekIsUUFBUSxnQkFBZ0IsUUFBUSxJQUFJLE1BQU07QUFBQSxNQUMxQztBQUFBLElBQ0o7QUFBQSxJQUNBO0FBQUEsTUFDSSxHQUFHLGVBQWUsT0FBTztBQUFBLE1BQ3pCLFFBQVE7QUFBQSxNQUNSLE9BQU8sQ0FBQyxnQkFBZ0I7QUFBQSxNQUN4QixNQUFNLFlBQVk7QUFDZCxZQUFJLFdBQVcsT0FBTztBQUNsQixnQkFBTSxVQUFVLGdCQUFnQixRQUFRLElBQUksTUFBTSxpQkFBaUIsd0JBQXdCO0FBQUEsUUFDL0Y7QUFBQSxNQUNKO0FBQUEsTUFDQSxRQUFRLGdCQUFnQixRQUFRLElBQUksTUFBTTtBQUFBLE1BQzFDO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFDSjs7O0FEN0VBLElBQU8sb0NBQVEsYUFBYTtBQUFBLEVBQ3hCLEdBQUcsb0JBQW9CLEVBQUUsUUFBUSxPQUFPLFVBQVUsVUFBVSxDQUFDO0FBQUEsRUFDN0QsR0FBRyxvQkFBb0IsRUFBRSxRQUFRLE9BQU8sVUFBVSxVQUFVLENBQUM7QUFDakUsQ0FBQzsiLAogICJuYW1lcyI6IFsib3B0aW9ucyIsICJmb3JtYXQiXQp9Cg==
