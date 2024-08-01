'use client';
import ChatSection from '@/components/chat/ChatSection';
import LineMap from '@/components/chat/LineMap';
import { useEffect, useMemo, useState } from 'react';
import { useCourse } from '@/hooks/useCourse';
import UserMessage from '@/components/chat/UserMessage';
import ChatbotMessage from '@/components/chat/ChatbotMessage';
import RecommendationQuestion from '@/components/chat/RecommendationQuestion';
import SendSection from '@/components/chat/SendSection';
import PlusIcon from '@/components/icons/PlusIcon';
import SendInput from '@/components/chat/SendInput';
import useInput from '@/hooks/useInput';
import HandIcon from '@/components/icons/HandIcon';
import api from '@/app/api';
import type { BotMessage, SendMessage } from '@/types/api';
import { RedirectType, useParams } from 'next/navigation';
import { Messages, useSessions } from '@/store';
import LodaingMessage from '@/components/chat/LodaingMessage';
import useScroll from '@/hooks/useScroll';
import { ErrorMessage } from '@/types/chat';
import ChatTooltip from '@/components/chat/ChatTooltip';
import { Location } from '@/types/course';

const questions = [
  '재밌는 이야기 해주세요',
  '뭔가 자극적인 이야기가 듣고 싶어요',
  '여기에 어떤 사람들이 묵었나요?',
];

const errorMessage: ErrorMessage = {
  content: '문제가 발생하였습니다.',
  role: 'assistant',
  timestamp: new Date().toISOString(),
};

export default function ClientComponent() {
  const [isOpen, setOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [renderElement, setRenderElement] = useState<JSX.Element[]>([]);
  const { course, locationName, locationId, lastId, visitLocation } =
    useCourse();
  const { isStorage, sessionMessages, setSessionMessages, syncStorage } =
    useSessions();
  const { scrollToBottom } = useScroll();
  const { value, onChange, reset } = useInput('');
  const params = useParams<{ sessionId: string }>();
  const sessionId = useMemo(() => Number(params.sessionId), [params.sessionId]);
  const messages = useMemo(() => {
    let memo: Messages | undefined = undefined;

    for (const el of sessionMessages) {
      memo = el[sessionId]?.messages;
    }

    // for (const sessions of sessionMessages) {
    //   if (sessions[sessionId]?.location.id == locationId) {
    //     memo = sessions[sessionId].location.messages;
    //     break;
    //   }
    // }

    return memo;
  }, [sessionId, sessionMessages]);

  const handleOpenClick = () => setOpen(!isOpen);
  const handleQuestionClick = (question: string) => {
    if (isLoading) return;

    const send = async () => {
      setIsLoading(true);
      try {
        const res = await api.messages(sessionId, {
          content: question,
          role: 'user',
          timestamp: new Date().toISOString(),
        });
        if (!res) return;

        setSessionMessages({
          locationId: locationId,
          message: res,
          sessionId: sessionId,
        });
      } catch (error) {
        setSessionMessages({
          locationId: locationId,
          message: errorMessage,
          sessionId: sessionId,
        });
      }
      setIsLoading(false);
    };

    send();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const send: SendMessage = {
      building_id: locationId,
      content: value,
      role: 'user',
      timestamp: new Date().toISOString(),
    };
    setSessionMessages({
      locationId: locationId,
      message: send,
      sessionId: sessionId,
    });
    reset();
    setIsLoading(true);

    try {
      const res = await api.messages(sessionId, send);
      if (res) {
        setSessionMessages({
          locationId: locationId,
          message: res,
          sessionId: sessionId,
        });
      }
    } catch (error) {
      setSessionMessages({
        locationId: locationId,
        message: errorMessage,
        sessionId: sessionId,
      });
    }
    setIsLoading(false);
  };

  const handleLocationClick = (location: Location) => {
    // console.log(`${rowIndex}/${colIndex}`);
    visitLocation(location);
  };

  useEffect(() => {
    if (!isStorage) return;
    if (!!messages) return; // 값이 있을 때 true
    console.log(messages);

    const sendMessage: SendMessage = {
      building_id: locationId,
      content: `${locationName} 도착`,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    setSessionMessages({
      locationId: locationId,
      message: sendMessage,
      sessionId: sessionId,
    });
    setIsLoading(true);

    const send = async () => {
      try {
        const res = await api.messages(sessionId, sendMessage);

        if (res) {
          setSessionMessages({
            locationId: locationId,
            message: res,
            sessionId: sessionId,
          });
          setIsLoading(false);
        }
      } catch (error) {
        // initSessionMessages(sessionId);
        setSessionMessages({
          locationId: locationId,
          message: errorMessage,
          sessionId: sessionId,
        });
      }
    };

    send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStorage]);

  useEffect(() => {
    let render: JSX.Element[] = [];

    messages?.forEach((message) => {
      const el =
        message.role == 'user' ? (
          <UserMessage text={message.content} key={message.timestamp} />
        ) : (
          <ChatbotMessage text={message.content} key={message.timestamp} />
        );
      render.push(el);

      if (render.length == 2) {
        const el = (
          <RecommendationQuestion
            key={'questions'}
            questions={questions}
            onClick={handleQuestionClick}
          />
        );
        render.push(el);
      }
    });

    setRenderElement(render);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    syncStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (renderElement.length != 0) {
      scrollToBottom();
    }
    if (isLoading) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderElement, isLoading]);

  return (
    <>
      <LineMap
        course={course}
        location={locationName}
        locationId={locationId}
        lastId={lastId}
        onOpen={handleOpenClick}
        isOpen={isOpen}
        onClick={handleLocationClick}
      />
      <ChatSection
        sendComponent={
          <SendSection>
            <PlusIcon />
            <form
              className="w-full h-[40px] bg-neutral-100 flex pl-8 py-1 pr-1 rounded-[20px] relative"
              onSubmit={handleSubmit}
            >
              <SendInput value={value} onChange={onChange} />
              <button className="">
                <HandIcon />
              </button>
            </form>
          </SendSection>
        }
      >
        {renderElement}
        {<LodaingMessage isLoading={isLoading} />}
      </ChatSection>
    </>
  );
}
