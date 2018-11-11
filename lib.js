'use strict';


/**
 * Фильтр друзей
 */

class Filter {
    filter() {
        return true;
    }
}

/**
 * Фильтр друзей
 * @extends Filter
 */
class MaleFilter extends Filter {
    filter(person) {
        return person.gender === 'male';
    }
}

/**
 * Фильтр друзей-девушек
 * @extends Filter
 */
class FemaleFilter extends Filter {
    filter(person) {
        return person.gender === 'female';
    }
}

class FilterCollection extends Filter {
    constructor(...filters) {
        super();
        this.filters = filters;
    }

    filter(person, iterator) {
        return this.filters
            .map(filter => filter.filter(person, iterator))
            .every(value => value);
    }
}

class LimitedFilter extends Filter {
    constructor(maxLevel) {
        super();
        this.maxLevel = maxLevel;
    }

    filter(person, iterator) {
        return iterator.friendLevel.get(person.name) < this.maxLevel;
    }
}

function friendSortFunc(first, second) {
    if ((first.best || false) === (second.best || false)) {
        return first.name.localeCompare(second.name);
    }

    return Number(second.best || false) - Number(first.best || false);
}

class Iterator {

    /**
     * Итератор по друзьям
     * @constructor
     * @param {Object[]} friends
     * @param {Filter} filter
     */
    constructor(friends, filter) {
        if (!(filter instanceof Filter)) {
            throw new TypeError('filter не является экземпляром Filter');
        }
        this.friendLevel = getFriendLevel(friends);
        this.friends = friends
            .filter(friend => filter.filter(friend, this))
            .sort((first, second) => {
                if (this.friendLevel.get(first.name) === this.friendLevel.get(second.name)) {
                    return friendSortFunc(first, second);
                }

                return this.friendLevel.get(first.name) - this.friendLevel.get(second.name);
            });
        this.index = 0;
    }

    next() {
        if (!this.done()) {
            const friend = this.friends[this.index];
            this.index++;

            return friend;
        }

        return null;
    }

    done() {
        return this.index >= this.friends.length;
    }
}

class Queue {
    constructor(iterable) {
        this.first = null;
        this.last = null;
        this.queueLength = 0;
        iterable.forEach(item => this.enqueue(item));
    }

    enqueue(item) {
        this.queueLength++;
        const queueItem = { item: item, next: null };
        if (this.last === null) {
            this.first = queueItem;
            this.last = queueItem;
        } else {
            this.last.next = queueItem;
            this.last = queueItem;
        }
    }

    dequeue() {
        const item = this.first;
        this.first = this.first.next;
        if (this.first === null) {
            this.last = null;
        }
        this.queueLength--;

        return item.item;
    }

    get length() {
        return this.queueLength;
    }
}

function getFriendLevel(friends) {
    const friendMap = new Map(friends.map(friend => [friend.name, friend]));
    const bestFriends = friends.filter(friend => friend.best);
    const friendLevel = new Map(bestFriends.map(friend => [friend.name, 0]));
    const queue = new Queue(bestFriends);
    while (queue.length > 0) {
        const currentFriend = queue.dequeue();
        currentFriend.friends
            .filter(friend => !friendLevel.has(friend))
            .forEach(friend => {
                queue.enqueue(friendMap.get(friend));
                friendLevel.set(friend, friendLevel.get(currentFriend.name) + 1);
            });
    }

    return friendLevel;
}

class LimitedIterator extends Iterator {

    /**
     * Итератор по друзям с ограничением по кругу
     * @extends Iterator
     * @constructor
     * @param {Object[]} friends
     * @param {Filter} filter
     * @param {Number} maxLevel – максимальный круг друзей
     */
    constructor(friends, filter, maxLevel) {
        super(friends, new FilterCollection(filter, new LimitedFilter(maxLevel)));
    }
}

exports.Iterator = Iterator;
exports.LimitedIterator = LimitedIterator;

exports.Filter = Filter;
exports.MaleFilter = MaleFilter;
exports.FemaleFilter = FemaleFilter;
