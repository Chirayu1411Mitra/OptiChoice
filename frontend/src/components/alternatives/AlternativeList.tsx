import { useState, type FormEvent } from "react";
import { ArrowUpRight, Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDelete } from "@/components/ui/ConfirmDelete";
import type { Alternative } from "@/types/decision";
import { decisionService, type ProductSearchResult } from "@/services/decisionService";

interface Props {
  items: Alternative[];
  onAdd: (name: string) => void;
  onAddProduct: (name: string, productInfo: NonNullable<Alternative["productInfo"]>) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

export function AlternativeList({ items, onAdd, onAddProduct, onRename, onRemove }: Props) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const [fetchedAt, setFetchedAt] = useState("");
  const [searching, setSearching] = useState(false);
  const [addingProductId, setAddingProductId] = useState("");
  const [searchError, setSearchError] = useState("");
  const duplicate = items.some((a) => a.name.trim().toLowerCase() === name.trim().toLowerCase());

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || duplicate) return;
    onAdd(name.trim());
    setName("");
  }

  async function search(e: FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2 || searching) return;
    setSearching(true);
    setSearchError("");
    try {
      const result = await decisionService.searchProducts(query.trim());
      setProducts(result.products);
      setFetchedAt(result.fetchedAt);
      if (result.products.length === 0) setSearchError("No product matches came back. Try a shorter model name.");
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Could not search products right now.");
    } finally {
      setSearching(false);
    }
  }

  async function addProduct(product: ProductSearchResult) {
    const normalized = product.title.trim().toLowerCase();
    if (addingProductId || items.some((item) => item.name.trim().toLowerCase() === normalized)) return;
    setAddingProductId(product.id);
    let specs: NonNullable<Alternative["productInfo"]>["specs"];
    if (product.productId) {
      try {
        specs = await decisionService.getProductSpecifications(product.productId, product.title);
      } catch {
        // Keep the listing and price even if its optional specifications are unavailable.
      }
    }
    onAddProduct(product.title, {
      source: product.source,
      sourceUrl: product.sourceUrl,
      fetchedAt,
      price: product.price,
      priceLabel: product.priceLabel,
      productId: product.productId,
      ...(specs ? { specs } : {}),
    });
    setAddingProductId("");
  }

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <ul className="divide-y rounded-lg border bg-card">
          {items.map((a, i) => (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2">
              <span className="w-5 text-center text-xs tabular text-muted-foreground">{i + 1}</span>
              <Input
                aria-label={`Alternative ${i + 1} name`}
                value={a.name}
                onChange={(e) => onRename(a.id, e.target.value)}
                className="h-8 border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-input"
              />
              {a.productInfo && <a className="shrink-0 text-xs text-muted-foreground hover:text-primary" href={a.productInfo.sourceUrl} target="_blank" rel="noreferrer" title={`View at ${a.productInfo.source}`}>{a.productInfo.source}<ArrowUpRight className="ml-1 inline h-3 w-3" /></a>}
              <ConfirmDelete label={a.name} onConfirm={() => onRemove(a.id)} />
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="flex gap-2">
        <Input placeholder="e.g. MacBook Air" value={name} onChange={(e) => setName(e.target.value)} aria-label="New alternative name" />
        <Button type="submit" variant="outline" disabled={!name.trim() || duplicate}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>
      {duplicate && name.trim() && <p className="text-xs text-destructive">This option already exists.</p>}
      <section className="space-y-3 rounded-xl border bg-background p-4">
        <div>
          <h3 className="text-sm font-semibold">Find laptop options online</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Add a listing to look up its price, battery life, weight, and a Geekbench 6 CPU performance estimate when available. We’ll show a source for found details; anything not found can be entered manually.</p>
        </div>
        <form onSubmit={search} className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Lenovo ThinkPad X1 Carbon" aria-label="Search laptop products" />
          <Button type="submit" variant="outline" disabled={query.trim().length < 2 || searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </form>
        {searchError && <p role="status" className="text-sm text-muted-foreground">{searchError}</p>}
        {products.length > 0 && <ul className="divide-y rounded-lg border bg-card">
          {products.map((product) => {
            const alreadyAdded = items.some((item) => item.name.trim().toLowerCase() === product.title.trim().toLowerCase());
            return <li key={product.id} className="flex flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap">
              {product.imageUrl && <img src={product.imageUrl} alt="" loading="lazy" className="h-12 w-12 rounded-md border bg-background object-contain" />}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">{product.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{product.source}{product.priceLabel ? ` · ${product.priceLabel}` : product.price !== null ? ` · ${product.price}` : " · Price unavailable"}</p>
              </div>
              <a className="inline-flex items-center gap-1 text-xs text-primary hover:underline" href={product.sourceUrl} target="_blank" rel="noreferrer">Source <ArrowUpRight className="h-3 w-3" /></a>
              <Button type="button" size="sm" variant="outline" disabled={alreadyAdded || !!addingProductId} onClick={() => void addProduct(product)}>
                {addingProductId === product.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} {alreadyAdded ? "Added" : addingProductId === product.id ? "Getting details…" : "Add option"}
              </Button>
            </li>;
          })}
        </ul>}
        {products.length > 0 && <p className="text-[11px] text-muted-foreground">Listings are supplied by an external product search. Check the retailer page for current details.</p>}
      </section>
    </div>
  );
}
