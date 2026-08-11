import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TextField } from "@/ui/text-field";

/**
 * U1.T7 — TextField primitive (DNF-8): <label> + <input type="url"> with a
 * reserved error slot that announces errors via role="alert".
 */
describe("TextField (DNF-8)", () => {
  it("renders a label associated with the input", () => {
    render(<TextField id="url" label="URL del sitio" />);
    expect(screen.getByLabelText("URL del sitio")).toHaveAttribute("id", "url");
  });

  it("defaults the input type to url", () => {
    render(<TextField id="url" label="URL del sitio" />);
    expect(screen.getByLabelText("URL del sitio")).toHaveAttribute(
      "type",
      "url",
    );
  });

  it("renders the error with role=alert", () => {
    render(
      <TextField
        id="url"
        label="URL del sitio"
        error="Ingresá una URL válida"
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Ingresá una URL válida");
  });

  it("marks the input invalid and describes the error", () => {
    render(
      <TextField
        id="url"
        label="URL del sitio"
        error="Ingresá una URL válida"
      />,
    );
    const input = screen.getByLabelText("URL del sitio");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "url-error");
  });

  it("renders no alert and no aria-invalid when there is no error", () => {
    render(<TextField id="url" label="URL del sitio" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("URL del sitio")).not.toHaveAttribute(
      "aria-invalid",
    );
  });

  it("forwards native input props", () => {
    const onChange = vi.fn();
    render(
      <TextField
        id="url"
        label="URL del sitio"
        placeholder="https://ejemplo.com"
        onChange={onChange}
      />,
    );
    const input = screen.getByLabelText("URL del sitio");
    expect(input).toHaveAttribute("placeholder", "https://ejemplo.com");
    fireEvent.change(input, { target: { value: "https://a.com" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("reserves space for the error slot to avoid layout shift", () => {
    const { container } = render(<TextField id="url" label="URL del sitio" />);
    const errorSlot = container.querySelector("[data-error-slot]");
    expect(errorSlot).not.toBeNull();
    expect(errorSlot?.className).toContain("min-h-");
  });
});
