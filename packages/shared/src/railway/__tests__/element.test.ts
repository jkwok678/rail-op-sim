import { describe, it, expect } from "vitest";
import {
  Element,
  Text,
  NamedElement,
  NamedLocation,
  Concourse,
  Parapet,
} from "../element";
import { ParapetType } from "../enums";
import type { FontInfo } from "../types";

// A minimal concrete Element subclass for testing the abstract base
class TestElement extends Element {
  toString(): string {
    return `TestElement,${this.locationToString()}`;
  }
  toSaveString(): string {
    return this.locationToString();
  }
}

const testFont: FontInfo = { family: "Arial", pointSize: 12 };

// ============================================================================
// Element (abstract base)
// ============================================================================

describe("Element", () => {
  describe("default constructor", () => {
    it("sets locationX and locationY to 0", () => {
      const el = new TestElement();
      expect(el.getLocationX()).toBe(0);
      expect(el.getLocationY()).toBe(0);
    });
  });

  describe("parameterized constructor", () => {
    it("sets location from arguments", () => {
      const el = new TestElement(5, 10);
      expect(el.getLocationX()).toBe(5);
      expect(el.getLocationY()).toBe(10);
    });
  });

  describe("getters/setters", () => {
    it("getLocationX returns current x", () => {
      const el = new TestElement(3, 4);
      expect(el.getLocationX()).toBe(3);
    });

    it("setLocationX updates x", () => {
      const el = new TestElement(3, 4);
      el.setLocationX(100);
      expect(el.getLocationX()).toBe(100);
    });

    it("getLocationY returns current y", () => {
      const el = new TestElement(3, 4);
      expect(el.getLocationY()).toBe(4);
    });

    it("setLocationY updates y", () => {
      const el = new TestElement(3, 4);
      el.setLocationY(200);
      expect(el.getLocationY()).toBe(200);
    });
  });

  describe("locationToString", () => {
    it('returns "x,y" format', () => {
      const el = new TestElement(5, 10);
      expect(el.locationToString()).toBe("5,10");
    });
  });
});

// ============================================================================
// Text
// ============================================================================

describe("Text", () => {
  describe("constructor", () => {
    it("stores location, text, and font", () => {
      const text = new Text(10, 20, "Platform 1", testFont);
      expect(text.getLocationX()).toBe(10);
      expect(text.getLocationY()).toBe(20);
      expect(text.getReadableText()).toBe("Platform 1");
      expect(text.getFont()).toEqual(testFont);
    });

    it("defaults fontSize to 12", () => {
      const text = new Text(0, 0, "test", testFont);
      expect(text.getFontSize()).toBe(12);
    });

    it("sets editableX/Y to location + fontSize", () => {
      const text = new Text(10, 20, "test", testFont);
      expect(text.getEditableX()).toBe(22); // 10 + 12
      expect(text.getEditableY()).toBe(32); // 20 + 12
    });
  });

  describe("getters/setters", () => {
    it("updates fontSize via setter", () => {
      const text = new Text(0, 0, "test", testFont);
      text.setFontSize(16);
      expect(text.getFontSize()).toBe(16);
    });

    it("updates readableText via setter", () => {
      const text = new Text(0, 0, "old", testFont);
      text.setReadableText("new");
      expect(text.getReadableText()).toBe("new");
    });

    it("updates font via setter", () => {
      const text = new Text(0, 0, "test", testFont);
      const newFont: FontInfo = { family: "Helvetica", pointSize: 14 };
      text.setFont(newFont);
      expect(text.getFont()).toEqual(newFont);
    });

    it("updates editableX/Y via setters", () => {
      const text = new Text(0, 0, "test", testFont);
      text.setEditableX(100);
      text.setEditableY(200);
      expect(text.getEditableX()).toBe(100);
      expect(text.getEditableY()).toBe(200);
    });
  });

  describe("toString", () => {
    it('returns "Text,x,y,readableText,family,pointSize"', () => {
      const text = new Text(5, 10, "Hello", {
        family: "Arial",
        pointSize: 12,
      });
      expect(text.toString()).toBe("Text,5,10,Hello,Arial,12");
    });
  });

  describe("toSaveString", () => {
    it('returns "x,y,readableText,family,pointSize"', () => {
      const text = new Text(5, 10, "Hello", {
        family: "Arial",
        pointSize: 12,
      });
      expect(text.toSaveString()).toBe("5,10,Hello,Arial,12");
    });
  });
});

// ============================================================================
// NamedElement (abstract)
// ============================================================================

class TestNamedElement extends NamedElement {
  toSaveString(): string {
    return this.locationToString();
  }
}

describe("NamedElement", () => {
  describe("default state", () => {
    it("text is null by default", () => {
      const el = new TestNamedElement();
      expect(el.getText()).toBeNull();
    });

    it("getNamed returns false when text is null", () => {
      const el = new TestNamedElement();
      expect(el.getNamed()).toBe(false);
    });
  });

  describe("setText / getText", () => {
    it("associates a Text object", () => {
      const el = new TestNamedElement();
      const text = new Text(0, 0, "label", testFont);
      el.setText(text);
      expect(el.getText()).toBe(text);
    });

    it("getNamed returns true after setText", () => {
      const el = new TestNamedElement();
      el.setText(new Text(0, 0, "label", testFont));
      expect(el.getNamed()).toBe(true);
    });

    it("sets text back to null", () => {
      const el = new TestNamedElement();
      const text = new Text(0, 0, "label", testFont);
      el.setText(text);
      el.setText(null);
      expect(el.getText()).toBeNull();
      expect(el.getNamed()).toBe(false);
    });
  });

  describe("toString", () => {
    it("without text", () => {
      const el = new TestNamedElement(5, 10);
      expect(el.toString()).toContain("5,10");
    });

    it("with text includes text serialization", () => {
      const el = new TestNamedElement(5, 10);
      const text = new Text(0, 0, "label", { family: "Arial", pointSize: 12 });
      el.setText(text);
      expect(el.toString()).toContain("Text,");
    });
  });
});

// ============================================================================
// NamedLocation
// ============================================================================

describe("NamedLocation", () => {
  describe("constructor", () => {
    it("sets location and defaults text to null", () => {
      const nl = new NamedLocation(5, 10);
      expect(nl.getLocationX()).toBe(5);
      expect(nl.getLocationY()).toBe(10);
      expect(nl.getText()).toBeNull();
      expect(nl.getNamed()).toBe(false);
    });
  });

  describe("toString", () => {
    it('returns "NamedLocation,x,y" without text', () => {
      const nl = new NamedLocation(5, 10);
      expect(nl.toString()).toBe("NamedLocation,5,10");
    });

    it("includes text serialization when named", () => {
      const nl = new NamedLocation(5, 10);
      const text = new Text(0, 0, "City", testFont);
      nl.setText(text);
      expect(nl.toString()).toBe(
        "NamedLocation,5,10,Text,0,0,City,Arial,12",
      );
    });
  });

  describe("toSaveString", () => {
    it('returns "x,y" without text', () => {
      const nl = new NamedLocation(5, 10);
      expect(nl.toSaveString()).toBe("5,10");
    });

    it("includes readableText when named", () => {
      const nl = new NamedLocation(5, 10);
      const text = new Text(0, 0, "City", testFont);
      nl.setText(text);
      expect(nl.toSaveString()).toBe("5,10,City");
    });
  });
});

// ============================================================================
// Concourse
// ============================================================================

describe("Concourse", () => {
  describe("constructor", () => {
    it("sets location and defaults text to null", () => {
      const c = new Concourse(3, 7);
      expect(c.getLocationX()).toBe(3);
      expect(c.getLocationY()).toBe(7);
      expect(c.getText()).toBeNull();
    });
  });

  describe("toString", () => {
    it('returns "Concourse,x,y" without text', () => {
      const c = new Concourse(3, 7);
      expect(c.toString()).toBe("Concourse,3,7");
    });

    it("includes text serialization when named", () => {
      const c = new Concourse(3, 7);
      c.setText(new Text(0, 0, "Station", testFont));
      expect(c.toString()).toBe(
        "Concourse,3,7,Text,0,0,Station,Arial,12",
      );
    });
  });

  describe("toSaveString", () => {
    it('returns "x,y" without text', () => {
      const c = new Concourse(3, 7);
      expect(c.toSaveString()).toBe("3,7");
    });

    it("includes readableText when named", () => {
      const c = new Concourse(3, 7);
      c.setText(new Text(0, 0, "Station", testFont));
      expect(c.toSaveString()).toBe("3,7,Station");
    });
  });
});

// ============================================================================
// Parapet
// ============================================================================

describe("Parapet", () => {
  describe("constructor", () => {
    it("stores type and location", () => {
      const p = new Parapet(ParapetType.PARAPET1, 5, 10);
      expect(p.getParapetType()).toBe(ParapetType.PARAPET1);
      expect(p.getLocationX()).toBe(5);
      expect(p.getLocationY()).toBe(10);
    });
  });

  describe("setParapetType", () => {
    it("updates the type", () => {
      const p = new Parapet(ParapetType.PARAPET1, 0, 0);
      p.setParapetType(ParapetType.PARAPET28);
      expect(p.getParapetType()).toBe(ParapetType.PARAPET28);
    });
  });

  describe("parapetTypeToString", () => {
    it("maps PARAPET1 to P1", () => {
      const p = new Parapet(ParapetType.PARAPET1, 0, 0);
      expect(p.parapetTypeToString()).toBe("P1");
    });

    it("maps PARAPET15 to P15", () => {
      const p = new Parapet(ParapetType.PARAPET15, 0, 0);
      expect(p.parapetTypeToString()).toBe("P15");
    });

    it("maps PARAPET28 to P28", () => {
      const p = new Parapet(ParapetType.PARAPET28, 0, 0);
      expect(p.parapetTypeToString()).toBe("P28");
    });
  });

  describe("toString", () => {
    it('returns "Parapet,P1,5,10"', () => {
      const p = new Parapet(ParapetType.PARAPET1, 5, 10);
      expect(p.toString()).toBe("Parapet,P1,5,10");
    });
  });

  describe("toSaveString", () => {
    it('returns "P1,5,10"', () => {
      const p = new Parapet(ParapetType.PARAPET1, 5, 10);
      expect(p.toSaveString()).toBe("P1,5,10");
    });
  });
});

// ============================================================================
// Inheritance chains
// ============================================================================

describe("inheritance chains", () => {
  it("Text instanceof Element", () => {
    expect(new Text(0, 0, "t", testFont)).toBeInstanceOf(Element);
  });

  it("NamedLocation instanceof NamedElement and Element", () => {
    const nl = new NamedLocation(0, 0);
    expect(nl).toBeInstanceOf(NamedElement);
    expect(nl).toBeInstanceOf(Element);
  });

  it("Concourse instanceof NamedElement and Element", () => {
    const c = new Concourse(0, 0);
    expect(c).toBeInstanceOf(NamedElement);
    expect(c).toBeInstanceOf(Element);
  });

  it("Parapet instanceof Element", () => {
    expect(new Parapet(ParapetType.PARAPET1, 0, 0)).toBeInstanceOf(Element);
  });

  it("NamedLocation is NOT instanceof Concourse", () => {
    expect(new NamedLocation(0, 0)).not.toBeInstanceOf(Concourse);
  });

  it("Concourse is NOT instanceof NamedLocation", () => {
    expect(new Concourse(0, 0)).not.toBeInstanceOf(NamedLocation);
  });

  it("Parapet is NOT instanceof NamedElement", () => {
    expect(new Parapet(ParapetType.PARAPET1, 0, 0)).not.toBeInstanceOf(
      NamedElement,
    );
  });
});
