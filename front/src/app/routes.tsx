import { createBrowserRouter, useNavigate } from "react-router";
import FloatingButton from "./components/FloatingButton";
import Login from "./components/Login";
import Signup from "./components/Signup";
import KeywordMap from "./components/KeywordMap";
import MatchPosting from "./components/MatchPosting";
import BusinessPlan from "./components/BusinessPlan";
import Community from "./components/Community";
import CommunityPost from "./components/CommunityPost";
import MyPosts from "./components/MyPosts";
import MyPage from "./components/MyPage";
import ProfileEdit from "./components/ProfileEdit";
import StartupSurvey from "./components/StartupSurvey";
import CommunityWrite from "./components/CommunityWrite";
import ForgotPassword from "./components/ForgotPassword";
import Onboarding from "./components/Onboarding";


// ==========================================
// 💡 [START] StartupSurvey 래퍼 컴포넌트 시작
// ==========================================
function StartupSurveyWrapper() {
  const navigate = useNavigate();

  return (
    <StartupSurvey
      onComplete={() => {
        alert("진단이 완료되었습니다!");
        navigate("/"); 
      }}
    />
  );
}
// ==========================================
// 💡 [END] StartupSurvey 래퍼 컴포넌트 끝
// ==========================================

export const router = createBrowserRouter([
  
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  /* 비밀번호 찾기 라우터 */
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/",
    Component: FloatingButton,
    children: [
      {
        index: true,
        Component: Onboarding
      },
      {
        path: "keyword-map",
        Component: KeywordMap
      },
      {
        path: "startupsurvey",
        // 위에서 정의한 래퍼 컴포넌트를 라우터에 연결
        Component: StartupSurveyWrapper 
      },
      {
        path: "match-posting",
        Component: MatchPosting
      },
      {
        path: "business-plan",
        Component: BusinessPlan
      },
      {
        path: "community",
        Component: Community
      },
      {
        path: "community-post/:id",
        Component: CommunityPost
      },
      {
        path: "community-write",
        Component: CommunityWrite
      },
      {
        path: "my-posts",
        Component: MyPosts
      },
      {
        path: "mypage",
        Component: MyPage
      },
      {
        path: "profile-edit",
        Component: ProfileEdit
      },
    ],
  },
]);