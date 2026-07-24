"use client";

import { useRouter } from "next/navigation";
import {
  BidsHeader,
  BidsSidebar,
  PlaceBidModal,
  ViewBidsModal,
  ChecklistModal,
  PosterProfileModal,
  BottomNav,
  TaskFeed,
  useBidsPage,
} from "@/features/bids";

export default function BidsPage() {
  const router = useRouter();
  const page = useBidsPage();

  const {
    activeRole,
    isClient,
    isTasker,
    roleLabel,
    activeSession,
    visibleTasks,
    bids,
    activeCategory,
    setActiveCategory,
    searchTerm,
    setSearchTerm,
    sortMode,
    setSortMode,
    showFilters,
    setShowFilters,
    showCreateTask,
    setShowCreateTask,
    showMenu,
    setShowMenu,
    notificationCount,
    setNotificationCount,
    status,
    tone,
    busy,
    form,
    selectedTask,
    setSelectedTask,
    bidAmount,
    setBidAmount,
    bidMessage,
    setBidMessage,
    reviewTask,
    setReviewTask,
    selectedBidId,
    setSelectedBidId,
    reviewBids,
    checklistTask,
    setChecklistTask,
    posterProfileTask,
    setPosterProfileTask,
    handleLogout,
    openBidSheet,
    createTask,
    placeBid,
    updateBidReview,
    updateTaskPhase,
    getTaskBids,
  } = page;

  return (
    <>
      <div className="min-h-screen w-full bg-[#f8f6ff]">
        <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
          <BidsSidebar
            activeRole={activeRole}
            activeSession={activeSession}
            status={status}
            onHome={() => {
              router.push("/bids");
            }}
            onBrowseTasks={() => {}}
            onReviewBids={() => {}}
            onMyBids={() => router.push("/mybids")}
            onWallet={() => router.push("/wallet")}
            onMessages={() => {}}
            onLogout={handleLogout}
            onLogin={() => router.push("/login")}
          />

          <div className="overflow-hidden">
            <div className="min-h-screen w-full overflow-hidden bg-[#f8f6ff]">
              <BidsHeader
                activeRole={roleLabel}
                activeSession={activeSession}
                notificationCount={notificationCount}
                onNotifications={() => setNotificationCount(0)}
                onLogout={handleLogout}
                onMenu={() => setShowMenu((v) => !v)}
                showMenu={showMenu}
              />

              <TaskFeed
                isClient={isClient}
                isTasker={isTasker}
                showCreateTask={showCreateTask}
                showFilters={showFilters}
                searchTerm={searchTerm}
                activeCategory={activeCategory}
                sortMode={sortMode}
                visibleTasks={visibleTasks}
                bids={bids}
                busy={busy}
                status={status}
                tone={tone}
                form={form}
                onToggleCreateTask={() => setShowCreateTask((v) => !v)}
                onToggleFilters={() => setShowFilters((v) => !v)}
                onSearchChange={setSearchTerm}
                onCategoryChange={setActiveCategory}
                onSortChange={setSortMode}
                onCreateTask={createTask}
                onPlaceBid={openBidSheet}
                onViewBids={(task) => {
                  const taskBids = getTaskBids(task);
                  setReviewTask(task);
                  setSelectedBidId(taskBids[0]?.id ?? null);
                }}
                onOpenChecklist={setChecklistTask}
                onComplete={(task) => void updateTaskPhase(task, "completed")}
                onViewPoster={setPosterProfileTask}
                onLogin={() => router.push("/login")}
              />

              <BottomNav
                isClient={isClient}
                isTasker={isTasker}
                roleLabel={roleLabel}
                onHome={() => router.push("/")}
                onBrowseTasks={() => {}}
                onPost={() => setShowCreateTask(true)}
                onMyBids={() => router.push("/mybids")}
                onWallet={() => router.push("/wallet")}
                onMessages={() => {}}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </div>

      {selectedTask && isTasker && (
        <PlaceBidModal
          selectedTask={selectedTask}
          bidAmount={bidAmount}
          bidMessage={bidMessage}
          busy={busy === "place"}
          onAmountChange={setBidAmount}
          onMessageChange={setBidMessage}
          onSubmit={placeBid}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {reviewTask && isClient && (
        <ViewBidsModal
          reviewTask={reviewTask}
          reviewBids={reviewBids}
          selectedBidId={selectedBidId}
          busy={busy}
          onSelectBid={setSelectedBidId}
          onReject={() => void updateBidReview("reject")}
          onAccept={() => void updateBidReview("accept")}
          onClose={() => setReviewTask(null)}
        />
      )}

      {checklistTask && (
        <ChecklistModal
          checklistTask={checklistTask}
          onClose={() => setChecklistTask(null)}
        />
      )}

      {posterProfileTask && (
        <PosterProfileModal
          task={posterProfileTask}
          onClose={() => setPosterProfileTask(null)}
        />
      )}
    </>
  );
}
