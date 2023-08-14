<script>
   import { onMount } from "svelte";

   export let params = {};

   let post;

   async function load(postid) {
      return fetch(`https://jsonplaceholder.typicode.com/posts/${postid}`).then((r) => r.json());
   }

   onMount(() => {
      load(params.postid).then((obj) => (post = obj));
   });

   $: load(params.postid).then((obj) => (post = obj));
</script>

<svelte:head>
   <title>Post</title>
</svelte:head>

{#if post}
   <h1>{post.title}</h1>

   <div class="content">
      {@html post.body}
   </div>
{/if}

<style>
   .content :global(h2) {
      font-size: 1.4em;
      font-weight: 500;
   }
   .content :global(pre) {
      background-color: #f9f9f9;
      box-shadow: inset 1px 1px 5px rgba(0, 0, 0, 0.05);
      padding: 0.5em;
      border-radius: 2px;
      overflow-x: auto;
   }
   .content :global(pre) :global(code) {
      background-color: transparent;
      padding: 0;
   }
   .content :global(ul) {
      line-height: 1.5;
   }
   .content :global(li) {
      margin: 0 0 0.5em 0;
   }
</style>
