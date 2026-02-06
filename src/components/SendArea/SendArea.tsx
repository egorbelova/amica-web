import React, { useRef, useState, useCallback, useEffect } from 'react';
import { websocketManager } from '../../utils/websocket-manager';
import { useChat } from '../../contexts/ChatContext';
import { useUser } from '../../contexts/UserContext';
import { apiUpload } from '../../utils/apiFetch';
import DropZone from '../DropZone/DropZone';
import { Icon } from '../Icons/AutoIcons';
import { useSearchContext } from '@/contexts/search/SearchContext';
import styles from './SendArea.module.scss';
import JumpToBottom from '../JumpToBottom/JumpToBottom';
import './SendArea.css';

const MessageInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { selectedChat } = useChat();
  const { user } = useUser();
  const { setTerm, setResults } = useSearchContext();

  const roomId = selectedChat?.id;
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent): void => {
      if (
        document.activeElement === document.body &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        !e.shiftKey &&
        ![
          'Tab',
          'Escape',
          'F1',
          'F2',
          'F3',
          'F4',
          'F5',
          'F6',
          'F7',
          'F8',
          'F9',
          'F10',
          'F11',
          'F12',
        ].includes(e.key)
      ) {
        if (editableRef.current) {
          editableRef.current.focus();
          if (e.key.length === 1) {
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeydown, true);

    return () => {
      document.removeEventListener('keydown', handleGlobalKeydown, true);
    };
  }, []);

  const sendFilesViaHttp = useCallback(
    async (filesToSend: File[], textMessage: string = '') => {
      if (!user?.id || !roomId) {
        console.error('User ID or Room ID is missing');
        return false;
      }

      const formData = new FormData();

      formData.append('message', textMessage);
      formData.append('chat_id', roomId.toString());

      filesToSend.forEach((file) => {
        formData.append('file', file);
      });

      try {
        setIsUploading(true);

        console.log('Starting upload...');

        const result = await apiUpload(
          '/api/messages/',
          formData,
          (percent) => {
            console.log(`Uploading: ${percent}%`);
          },
        );

        console.log('Uploaded:', result);
        return true;
      } catch (error: any) {
        console.error('Error sending files:', error);
        alert(error?.message || error || 'Upload failed');
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [user?.id, roomId],
  );

  const mirrorRef = useRef<HTMLDivElement>(document.createElement('div'));

  useEffect(() => {
    const el = editableRef.current;
    const mirror = mirrorRef.current;
    if (!el) return;

    mirror.id = 'mirror';

    document.body.appendChild(mirror);

    return () => {
      document.body.removeChild(mirror);
    };
  }, []);

  const adjustHeight = useCallback(() => {
    const el = editableRef.current;
    const mirror = mirrorRef.current;
    if (!el || !mirror) return;

    mirror.textContent = el.textContent || '\u200b';

    const contentHeight = mirror.offsetHeight;

    const maxHeight = 200;

    if (contentHeight <= maxHeight) {
      el.style.height = contentHeight + 'px';
      el.style.overflowY = 'visible';
    } else {
      el.style.height = maxHeight + 'px';
      el.style.overflowY = 'auto';
    }
  }, []);

  const handleInput = useCallback(() => {
    const el = editableRef.current;
    if (!el) return;
    setMessage(el.innerText || '');
    adjustHeight();
  }, [adjustHeight]);

  useEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!message.trim() && files.length === 0) return;
      setTerm('');
      setResults([]);

      try {
        if (files.length > 0) {
          const success = await sendFilesViaHttp(files, message.trim());
          if (success) {
            setFiles([]);
            setMessage('');
            if (editableRef.current) {
              editableRef.current.innerText = '';
              editableRef.current.style.height = '20px';
            }
          }
        } else {
          websocketManager.sendMessage({
            type: 'chat_message',
            chat_id: roomId,
            data: {
              value: message.trim(),
              user_id: roomId < 0 ? selectedChat.members[0].id : undefined,
            },
          });

          setMessage('');
          if (editableRef.current) {
            editableRef.current.innerText = '';
            editableRef.current.style.height = '20px';
          }
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [message, files, roomId, sendFilesViaHttp],
  );

  const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;

      const newFiles = Array.from(fileList);

      const validFiles = [];
      for (const file of newFiles) {
        if (file.size > MAX_FILE_SIZE) {
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }

      e.target.value = '';
    },
    [],
  );

  const handleSelfieUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const selfieFile = e.target.files[0];
        setFiles((prev) => [...prev, selfieFile]);
      }
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();

      const text = e.clipboardData.getData('text/plain');

      if (!editableRef.current) return;

      const lines = text.split(/\r\n|\r|\n/);
      const html = lines.join('<br>');

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      range.deleteContents();

      const tempEl = document.createElement('div');
      tempEl.innerHTML = html;

      const frag = document.createDocumentFragment();
      let node: ChildNode | null;
      while ((node = tempEl.firstChild)) {
        frag.appendChild(node);
      }

      range.insertNode(frag);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);

      handleInput();
    },
    [handleInput],
  );

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSelfieClick = useCallback(() => {
    selfieInputRef.current?.click();
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleFiles = (files) => {
    setFiles(files);
  };

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const size = bytes / Math.pow(k, i);
    return `${size.toFixed(1)} ${sizes[i]}`;
  }

  return (
    <>
      <JumpToBottom />
      <DropZone onFiles={handleFiles} />
      <div className='send_div_container'>
        <form
          id='post-form'
          className='send_div send_div_class'
          encType='multipart/form-data'
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <button
            id='file_div'
            onClick={handleFileClick}
            type='button'
            onKeyDown={(e) => e.key === 'Enter' && handleFileClick()}
          >
            <input
              type='file'
              multiple
              name='file'
              id='file'
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              // accept='image/*,video/*,audio/*,.pdf,.doc,.docx'
            />
            <Icon name='Attachment' className='input_attach' />
          </button>

          <div
            className='textarea_container'
            onMouseDown={(e) => {
              e.preventDefault();
              editableRef.current?.focus();
            }}
            onClick={(e) => {
              e.preventDefault();
              editableRef.current?.focus();
            }}
          >
            <div
              ref={editableRef}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              className='textarea'
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
            />
            <span className='textarea_placeholder'>
              {message ? '' : 'Message'}
            </span>
          </div>

          <div
            id='selfie'
            style={{ display: 'none' }}
            onClick={handleSelfieClick}
            role='button'
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleSelfieClick()}
          >
            <input
              type='file'
              id='picture'
              name='file'
              accept='image/*'
              capture='environment'
              ref={selfieInputRef}
              onChange={handleSelfieUpload}
              style={{ display: 'none' }}
            />
            <Icon name='Selfie' className='camera_svg' />
          </div>

          <button
            type='submit'
            className='input_submit'
            disabled={(!message.trim() && files.length === 0) || isUploading}
            aria-label='Send Message'
          >
            <Icon name='SendMobile' className='send_svg' />
          </button>
        </form>

        {files.length > 0 && (
          <div className={styles['files-preview']}>
            <div className={styles['files-preview-header']}>
              <span>Attached Files ({files.length})</span>
              <button
                type='button'
                className={styles['clear-all-btn']}
                onClick={() => setFiles([])}
                aria-label='Clear all files'
              >
                Clear All
              </button>
            </div>
            <div className={styles['files-preview-list']}>
              {files.map((file, index) => {
                const getFileType = (file: File) => {
                  if (file.type.startsWith('image/')) return 'image';
                  if (file.type.startsWith('video/')) return 'video';
                  if (file.type === 'application/pdf') return 'pdf';
                  return 'file';
                };

                const fileType = getFileType(file);

                const previewUrl =
                  fileType === 'image' || fileType === 'video'
                    ? URL.createObjectURL(file)
                    : null;

                return (
                  <div key={index} className={styles['file-preview-item']}>
                    {fileType === 'image' && (
                      <img
                        src={previewUrl}
                        alt={file.name}
                        className={styles['file-preview-image']}
                      />
                    )}

                    {fileType === 'video' && (
                      <video
                        src={previewUrl}
                        muted
                        autoPlay
                        playsInline
                        className={styles['file-preview-image']}
                      />
                    )}
                    {fileType === 'file' && (
                      <div className={styles['file-preview-file']}>📄</div>
                    )}

                    <div className={styles['file-info']}>
                      <span className={styles['file-name']}>{file.name}</span>
                      <span className={styles['file-size']}>
                        <span>{formatFileSize(file.size)}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => removeFile(index)}
                      type='button'
                      className={styles['remove-file-btn']}
                    >
                      <Icon name='Cross' />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MessageInput;
