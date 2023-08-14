<script>
   import Navaid from "navaid";
   import { onDestroy } from "svelte";

   import Nav from "./components/Nav.svelte";
   import Home from "./pages/Home.svelte";
   import Blog from "./pages/Blog.svelte";
   import About from "./pages/About.svelte";
   import Article from "./pages/Article.svelte";

   let Route, params, active;
   let uri = location.pathname;

   $: active = uri.split("/")[1] || "home";

   function run(thunk, obj) {
      Route = thunk;
      params = obj;
      window.scrollTo(0, 0);
   }

   function track(obj) {
      uri = obj.state || obj.uri || location.pathname;
   }

   addEventListener("replacestate", track);
   addEventListener("pushstate", track);
   addEventListener("popstate", track);

   const router = Navaid("/")
      .on("/", () => run(Home))
      .on("/about", () => run(About))
      .on("/blog", () => run(Blog))
      .on("/blog/:postid", (obj) => run(Article, obj))
      .listen();

   onDestroy(router.destroy);
</script>

<Nav {active} />

<main>
   {#if !params}
      <svelte:component this={Route} />
   {:else}
      <svelte:component this={Route} {params} />
   {/if}
</main>

<style>
   main {
      display: block;
      max-width: 56em;
      padding: 2em;
      margin: 0 auto;
   }
</style>
