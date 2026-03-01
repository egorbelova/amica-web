import React from 'react';
import LeftSideBar from '../components/LeftSideBar/LeftSideBar';
import MainChatWindow from '../components/MainChatWindow/MainChatWindow';
import RoomWallpaper from './RoomWallpaper';
import './room.scss';
import styles from './RoomPage.module.scss';

const RoomPage: React.FC = () => {
  return (
    <>
      <RoomWallpaper />
      <div className={styles.roomPageContainer}>
        <LeftSideBar />
        <MainChatWindow />
      </div>
    </>
  );
};

export default React.memo(RoomPage);
