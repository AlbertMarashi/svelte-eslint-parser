<script lang="ts">
let foo: string | null = "baz" as string | null;
</script>
{#if foo === null}
  is null
{:else}
{ foo }
{/if}
