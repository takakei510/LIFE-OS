type RichTextItem = { plain_text?: unknown };
type PropertyMap = Record<string, unknown>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function richTextToString(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      const record = asRecord(item) as RichTextItem | null;
      return typeof record?.plain_text === "string" ? record.plain_text : "";
    })
    .join("");
}

export function title(properties: PropertyMap, name: string): string {
  const property = asRecord(properties[name]);
  return richTextToString(property?.title);
}

export function richText(properties: PropertyMap, name: string): string {
  const property = asRecord(properties[name]);
  return richTextToString(property?.rich_text);
}

export function number(properties: PropertyMap, name: string): number {
  const property = asRecord(properties[name]);
  return typeof property?.number === "number" ? property.number : 0;
}

export function checkbox(properties: PropertyMap, name: string): boolean {
  const property = asRecord(properties[name]);
  return property?.checkbox === true;
}

export function select(properties: PropertyMap, name: string): string | null {
  const property = asRecord(properties[name]);
  const value = asRecord(property?.select);
  return typeof value?.name === "string" ? value.name : null;
}

export function status(properties: PropertyMap, name: string): string | null {
  const property = asRecord(properties[name]);
  const value = asRecord(property?.status);
  return typeof value?.name === "string" ? value.name : null;
}

export function multiSelect(properties: PropertyMap, name: string): string[] {
  const property = asRecord(properties[name]);
  if (!Array.isArray(property?.multi_select)) return [];
  return property.multi_select.flatMap((item) => {
    const record = asRecord(item);
    return typeof record?.name === "string" ? [record.name] : [];
  });
}

export function date(properties: PropertyMap, name: string): string | null {
  const property = asRecord(properties[name]);
  const value = asRecord(property?.date);
  return typeof value?.start === "string" ? value.start : null;
}

export function files(
  properties: PropertyMap,
  name: string,
): Array<{ name: string; type: "file" | "external" | "file_upload" | "unknown"; url: string | null }> {
  const property = asRecord(properties[name]);
  if (!Array.isArray(property?.files)) return [];

  return property.files.flatMap((item) => {
    const record = asRecord(item);
    if (!record) return [];

    const file = asRecord(record.file);
    const external = asRecord(record.external);
    const fileUpload = asRecord(record.file_upload);
    const type = record.type;

    return [{
      name: typeof record.name === "string" ? record.name : "media",
      type: type === "file" || type === "external" || type === "file_upload" ? type : "unknown",
      url:
        typeof file?.url === "string"
          ? file.url
          : typeof external?.url === "string"
            ? external.url
            : typeof fileUpload?.url === "string"
              ? fileUpload.url
              : null,
    }];
  });
}

export function formulaNumber(properties: PropertyMap, name: string): number {
  const property = asRecord(properties[name]);
  const formula = asRecord(property?.formula);
  return typeof formula?.number === "number" ? formula.number : 0;
}

export function formulaString(properties: PropertyMap, name: string): string | null {
  const property = asRecord(properties[name]);
  const formula = asRecord(property?.formula);
  return typeof formula?.string === "string" ? formula.string : null;
}

export function rollupNumber(properties: PropertyMap, name: string): number {
  const property = asRecord(properties[name]);
  const rollup = asRecord(property?.rollup);
  return typeof rollup?.number === "number" ? rollup.number : 0;
}
