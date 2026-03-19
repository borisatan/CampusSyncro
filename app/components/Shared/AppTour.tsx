import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTourStore } from '../../store/useAppTourStore';

const CARD_MARGIN = 20;
const ARROW_SIZE = 9;
const CARD_BG = '#1C2535';

interface PageTourProps {
  pageId: string;
  title: string;
  description: string;
  targetRef: React.RefObject<View>;
}

export function PageTour({ pageId, title, description, targetRef }: PageTourProps) {
  const { isPageSeen, markPageSeen } = useAppTourStore();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [layout, setLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const measured = useRef(false);

  const seen = isPageSeen(pageId);

  useEffect(() => {
    if (seen || measured.current) return;
    // Wait for layout to settle before measuring
    const t = setTimeout(() => {
      targetRef.current?.measureInWindow((x, y, w, h) => {
        if (w > 0 && h > 0) {
          measured.current = true;
          // measureInWindow returns y relative to safe area origin on some devices;
          // add the top inset so the spotlight aligns with the modal's coordinate system.
          setLayout({ x, y: y + insets.top, width: w, height: h });
        }
      });
    }, 350);
    return () => clearTimeout(t);
  }, [seen]);

  if (seen || !layout) return null;

  const targetCenterX = layout.x + layout.width / 2;
  const targetCenterY = layout.y + layout.height / 2;
  const isTargetInTopHalf = targetCenterY < screenHeight / 2;

  // Horizontal arrow position relative to card left edge (clamped)
  const cardLeft = CARD_MARGIN;
  const cardRight = screenWidth - CARD_MARGIN;
  const cardWidth = cardRight - cardLeft;
  const arrowLeft = Math.max(12, Math.min(cardWidth - 12 - ARROW_SIZE * 2, targetCenterX - cardLeft - ARROW_SIZE));

  // Vertical card position
  const gap = 10;
  const cardPositionStyle = isTargetInTopHalf
    ? { top: layout.y + layout.height + gap, left: CARD_MARGIN, right: CARD_MARGIN }
    : { bottom: screenHeight - layout.y + gap, left: CARD_MARGIN, right: CARD_MARGIN };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => markPageSeen(pageId)}>
      {/* Backdrop */}
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.78)' }}>

        {/* Spotlight ring around target */}
        <View
          style={{
            position: 'absolute',
            left: layout.x - 6,
            top: layout.y - 6,
            width: layout.width + 12,
            height: layout.height + 12,
            borderRadius: Math.min(layout.width, layout.height) / 2 + 6,
            borderWidth: 2,
            borderColor: '#3B7EFF',
            shadowColor: '#3B7EFF',
            shadowOpacity: 0.8,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
            elevation: 8,
          }}
        />

        {/* Tooltip card */}
        <View style={{ position: 'absolute', ...cardPositionStyle }}>
          {/* Arrow pointing toward target */}
          {isTargetInTopHalf ? (
            // Arrow on top of card (pointing up toward target above)
            <View
              style={{
                position: 'absolute',
                top: -ARROW_SIZE,
                left: arrowLeft,
                width: 0,
                height: 0,
                borderLeftWidth: ARROW_SIZE,
                borderRightWidth: ARROW_SIZE,
                borderBottomWidth: ARROW_SIZE,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: CARD_BG,
              }}
            />
          ) : (
            // Arrow on bottom of card (pointing down toward target below)
            <View
              style={{
                position: 'absolute',
                bottom: -ARROW_SIZE,
                left: arrowLeft,
                width: 0,
                height: 0,
                borderLeftWidth: ARROW_SIZE,
                borderRightWidth: ARROW_SIZE,
                borderTopWidth: ARROW_SIZE,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderTopColor: CARD_BG,
              }}
            />
          )}

          {/* Card body */}
          <View
            style={{
              backgroundColor: CARD_BG,
              borderRadius: 18,
              padding: 20,
              borderWidth: 1,
              borderColor: '#2A3A52',
            }}
          >
            <Text
              style={{
                color: '#F1F5F9',
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 7,
                letterSpacing: -0.3,
              }}
            >
              {title}
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 14, lineHeight: 21, marginBottom: 18 }}>
              {description}
            </Text>
            <TouchableOpacity
              onPress={() => markPageSeen(pageId)}
              style={{
                backgroundColor: '#3B7EFF',
                borderRadius: 12,
                paddingVertical: 11,
                alignItems: 'center',
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
