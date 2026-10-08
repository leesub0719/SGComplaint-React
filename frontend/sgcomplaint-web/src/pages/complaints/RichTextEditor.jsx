import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { FontSize, FONT_FAMILIES, FONT_SIZES } from './FontSize.js';

const PLACEHOLDER = '발생 일시, 버스 노선, 차량번호, 정류장, 상황 등을 자세히 작성해 주세요.';

/**
 * 민원 본문 에디터.
 *
 * 기존 complaint.js는 contenteditable + document.execCommand로 서식을 넣고,
 * 커서 위치(Range)를 직접 저장·복원해야 했다. Tiptap은 문서 상태와 선택 영역을
 * 내부에서 관리하므로 그 코드가 전부 사라진다.
 *
 * @param {(html: string, textLength: number) => void} onChange
 *        서버로 보낼 HTML과 글자수 제한 검사용 순수 텍스트 길이를 함께 올려준다.
 */
export default function RichTextEditor({ onChange, invalid, initialContent = '' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize,
    ],
    content: initialContent,
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML(), instance.getText().trim().length);
    },
    editorProps: {
      attributes: {
        class: 'editor-body',
        role: 'textbox',
        'aria-multiline': 'true',
        'data-placeholder': PLACEHOLDER,
      },
    },
  });

  if (!editor) return null;

  // 버튼이 눌린 상태를 표시하려면 현재 선택 영역의 활성 마크를 물어보면 된다.
  const toolbarButton = (label, title, command, activeName) => (
    <button
      type="button"
      title={title}
      className={editor.isActive(activeName) ? 'is-active' : ''}
      // mousedown 기본 동작을 막아야 에디터의 선택 영역이 풀리지 않는다.
      onMouseDown={(event) => event.preventDefault()}
      onClick={command}
    >
      {label}
    </button>
  );

  return (
    <div className={invalid ? 'editor-shell invalid' : 'editor-shell'}>
      <div
        className="editor-toolbar"
        role="toolbar"
        aria-label="본문 서식 도구"
      >
        <select
          aria-label="글꼴"
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => editor.chain().focus().setFontFamily(event.target.value).run()}
        >
          {FONT_FAMILIES.map((font) => (
            <option
              key={font.value}
              value={font.value}
            >
              {font.label}
            </option>
          ))}
        </select>

        <select
          aria-label="글자 크기"
          defaultValue="16px"
          onChange={(event) => editor.chain().focus().setFontSize(event.target.value).run()}
        >
          {FONT_SIZES.map((size) => (
            <option
              key={size.value}
              value={size.value}
            >
              {size.label}
            </option>
          ))}
        </select>

        <span
          className="toolbar-divider"
          aria-hidden="true"
        />

        {toolbarButton(
          <strong>B</strong>,
          '굵게',
          () => editor.chain().focus().toggleBold().run(),
          'bold',
        )}
        {toolbarButton(
          <em>I</em>,
          '기울임',
          () => editor.chain().focus().toggleItalic().run(),
          'italic',
        )}
        {toolbarButton(
          <u>U</u>,
          '밑줄',
          () => editor.chain().focus().toggleUnderline().run(),
          'underline',
        )}

        <span
          className="toolbar-divider"
          aria-hidden="true"
        />

        {toolbarButton(
          '• 목록',
          '글머리 목록',
          () => editor.chain().focus().toggleBulletList().run(),
          'bulletList',
        )}
        {toolbarButton(
          '1. 목록',
          '번호 목록',
          () => editor.chain().focus().toggleOrderedList().run(),
          'orderedList',
        )}

        <button
          type="button"
          title="서식 지우기"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          서식 지우기
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
