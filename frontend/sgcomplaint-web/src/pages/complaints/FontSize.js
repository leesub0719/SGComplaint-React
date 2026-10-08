import { Extension } from '@tiptap/core';

/**
 * 글자 크기 확장.
 *
 * Tiptap에는 글꼴(FontFamily)과 달리 글자 크기 공식 확장이 없어서,
 * TextStyle 마크에 fontSize 속성을 얹는 방식으로 직접 만든다.
 *
 * 기존 에디터는 document.execCommand('fontSize', ...)에 1~7 단계값을 넘겨
 * <font size="3"> 같은 비표준 태그를 만들었다. 여기서는 CSS
 * font-size(px)를 쓰므로 저장되는 HTML도 표준 형태가 된다.
 */
export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return { types: ['textStyle'] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: (size) => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

/** 기존 select의 "작게 / 보통 / 크게 / 매우 크게"에 대응하는 값. */
export const FONT_SIZES = [
  { label: '작게', value: '13px' },
  { label: '보통', value: '16px' },
  { label: '크게', value: '20px' },
  { label: '매우 크게', value: '24px' },
];

export const FONT_FAMILIES = [
  { label: '맑은 고딕', value: 'Malgun Gothic' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Verdana', value: 'Verdana' },
];
