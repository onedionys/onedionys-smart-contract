import builder from '@ckeditor/ckeditor5-builder';
import SourceEditing from '@ckeditor/ckeditor5-source-editing';
import Toolbar from '@ckeditor/ckeditor5-ui/src/toolbar';

const editorConfig = await builder.createEditorConfig({
    plugins: [SourceEditing, Toolbar],
});

export default editorConfig;
