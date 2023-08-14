<svelte:head>
   <title>Svelte Demo template</title>
</svelte:head>

<h1>Great success!</h1>

<figure>
   <img src="/img/logo.svg" alt="" />
   <figcaption>Good Job!</figcaption>
</figure>

<style>
   h1,
   figure {
      text-align: center;
      margin: 0 auto;
   }

   h1 {
      font-size: 2.8em;
      text-transform: uppercase;
      font-weight: 700;
      margin: 0 0 0.5em 0;
   }

   figure {
      margin: 0 0 1em 0;
   }

   img {
      width: 100%;
      max-width: 200px;
      margin: 0 0 1em 0;
   }

   @media (min-width: 480px) {
      h1 {
         font-size: 4em;
      }
   }
</style>
